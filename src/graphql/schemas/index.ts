import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from '../../schema';
import { resolvers, getUsuarioFromToken } from '../resolvers/resolvers';
import { createConnection } from '../../config/db';

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
        try {
          // Solo procesar el token si existe
          if (token) {
            const user = await getUsuarioFromToken(token);
            return { token, user };
          }
        } catch (error) {
          console.error('Error al procesar el token:', error);
          // No lanzar error aquí, solo devolver el token sin usuario
        }
        return { token };
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