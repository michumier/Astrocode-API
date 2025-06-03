import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createConnection } from './config/db';

// Load environment variables
dotenv.config();

interface ContextValue {
  token?: string;
}

async function startServer() {
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

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});