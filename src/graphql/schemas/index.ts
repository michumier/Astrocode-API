import type { Express, RequestHandler } from 'express';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { typeDefs } from '../../schema';
import { resolvers, getUsuarioFromToken } from '../resolvers/resolvers';
import { waitForDatabase } from '../../config/db';
import { aplicarMigraciones, sincronizarAdmins, limpiarIntentosAntiguos, sembrarRetosDePrueba } from '../../db/migrations';

// Load environment variables
dotenv.config();

interface ContextValue {
  token?: string;
  user?: any;
}

// Base de datos lista. Las migraciones pendientes se aplican al arrancar, también en Vercel (si ya están
// todas, es una sola consulta). Con MIGRAR_AL_ARRANCAR=0 se saltan y se aplican con `npm run migrar`.
async function prepararBaseDeDatos() {
  // En Vercel no tiene sentido esperar un minuto: si la BD no responde, falla rápido y se reintenta luego
  await (process.env.VERCEL ? waitForDatabase(3, 1000) : waitForDatabase());
  if (process.env.MIGRAR_AL_ARRANCAR !== '0') await aplicarMigraciones();
  await sincronizarAdmins();
  await limpiarIntentosAntiguos();
  await sembrarRetosDePrueba();
  console.log('Database connected successfully');
}

// Apollo y la base de datos se preparan una vez; las peticiones que llegan antes esperan a que acaben
async function prepararGraphQL(): Promise<RequestHandler> {
  const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  });
  await Promise.all([server.start(), prepararBaseDeDatos()]);

  return expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers['authorization'] || '';
      const context: ContextValue = { token };

      // Si hay token, intentar obtener el usuario; si no es válido, la petición sigue sin sesión
      if (token) {
        try {
          context.user = await getUsuarioFromToken(token);
        } catch {
          // Token inválido o caducado
        }
      }

      return context;
    },
  });
}

// Monta la API sobre una app de Express. La usan tanto `npm start`/Docker (con listen)
// como Vercel, que recibe la app exportada desde src/index.ts y la ejecuta como función.
export function configurarApp(app: Express) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el .env (mira .env.example)');
  }

  // Detrás del proxy de Vercel, la IP real del alumno llega en X-Forwarded-For
  if (process.env.VERCEL) app.set('trust proxy', 1);

  // Solo el front puede llamar a la API desde el navegador
  const origenes = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim());
  app.use(cors({ origin: origenes }));
  app.use(express.json({ limit: '100kb' }));

  // Límite general de peticiones por IP (frena fuerza bruta en login y abuso del runner)
  app.use(
    '/graphql',
    rateLimit({
      windowMs: 60 * 1000,
      limit: Number(process.env.RATE_LIMIT_PER_MIN || 120),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  let graphql: Promise<RequestHandler> | null = null;
  const listo = () => {
    // Si falla (p. ej. la BD no responde), la siguiente petición lo vuelve a intentar
    graphql ??= prepararGraphQL().catch((error) => {
      graphql = null;
      throw error;
    });
    return graphql;
  };

  app.use('/graphql', (req, res, next) => {
    listo().then((handler) => handler(req, res, next)).catch(next);
  });

  return listo;
}
