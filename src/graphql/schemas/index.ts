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
        console.log('Apollo Context: Procesando solicitud');
        console.log('Apollo Context: Headers recibidos:', JSON.stringify(req.headers, null, 2));
        
        const token = req.headers["authorization"] || "";
        console.log(`Apollo Context: Token de autorización: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
        
        // Contexto básico con el token
        const context: ContextValue = { token };
        
        // Si hay token, intentar obtener el usuario
        if (token) {
          try {
            console.log('Apollo Context: Intentando autenticar usuario con token');
            const user = await getUsuarioFromToken(token);
            context.user = user;
            console.log(`Apollo Context: Autenticación exitosa para usuario: ${user.nombre_usuario} (ID: ${user.id})`);
            console.log(`Apollo Context: Puntos del usuario: ${user.puntos}`);
          } catch (error) {
            console.error('Apollo Context: Error al autenticar usuario:', error);
            console.error('Apollo Context: La solicitud continuará sin autenticación');
          }
        } else {
          console.log('Apollo Context: No hay token de autorización, la solicitud continuará sin autenticación');
        }
        
        return context;
      }
    })
  );

  try {
    // Conexion a la Base de datos
    await createConnection();
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