import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { typeDefs } from '../../schema';
import { resolvers, getUsuarioFromToken } from '../resolvers/resolvers';
import { waitForDatabase } from '../../config/db';
import { aplicarMigraciones, sincronizarAdmins } from '../../db/migrations';

// Load environment variables
dotenv.config();

interface ContextValue {
  token?: string;
  user?: any;
}

export async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el .env (mira .env.example)');
  }

  const app = express();
  const port = process.env.PORT || 4000;
  const esProduccion = process.env.NODE_ENV === 'production';

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

  // Create Apollo Server
  const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
    introspection: !esProduccion,
  });

  // Start Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
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
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Conexión a la base de datos + migraciones pendientes
  await waitForDatabase();
  await aplicarMigraciones();
  await sincronizarAdmins();
  console.log('Database connected successfully');

  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  });
}
