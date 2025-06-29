import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { typeDefs } from '../../schema';
import { resolvers } from '../resolvers/resolvers';
import { createConnection, query } from '../../config/db';

// Load environment variables
dotenv.config();

interface ContextValue {
  token?: string;
  user?: any;
}

export async function startServer() {
  const app = express();
  const port = process.env.PORT || 4000;

  app.use(cors());
  app.use(json());

  // Create Apollo Server
  const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
  });

  // Start Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers["authorization"] || "";
        let user = null;
        
        if (token) {
          try {
            const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'tu-secreto-jwt') as any;
            const usuarios = await query(
              'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE id = ?',
              [decoded.id]
            ) as any[];
            if (usuarios.length > 0) {
              user = usuarios[0];
            }
          } catch (error) {
            // Token inválido, user permanece null
            console.log('Token inválido en contexto:', error instanceof Error ? error.message : 'Error desconocido');
          }
        }
        
        return { token, user };
      }
    })
  );

  try {
    // Conexion a la Base de datos DESCOMENTAR
    // await createConnection();
    console.log('Database connected successfully');

    // Start Express server
    app.listen(port, () => {
      console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Solo ejecutar si este archivo es el punto de entrada principal
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}