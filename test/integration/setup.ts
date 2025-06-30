import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno para pruebas
dotenv.config({ path: '.env.test' });

// Importar desde el proyecto principal
// Nota: Estos imports pueden necesitar ajustes según la estructura real del proyecto
let typeDefs: any;
let resolvers: any;

try {
  const schemaModule = require('../../src/schema');
  typeDefs = schemaModule.typeDefs || schemaModule.default;
} catch (error) {
  console.warn('No se pudo cargar typeDefs, usando schema básico');
  typeDefs = `
    type Query {
      hello: String
    }
    type Mutation {
      test: String
    }
  `;
}

try {
  const resolversModule = require('../../src/graphql/resolvers');
  resolvers = resolversModule.resolvers || resolversModule.default;
} catch (error) {
  console.warn('No se pudieron cargar resolvers, usando resolvers básicos');
  resolvers = {
    Query: {
      hello: () => 'Hello World'
    },
    Mutation: {
      test: () => 'Test'
    }
  };
}

// Variables globales para las pruebas
export let server: ApolloServer;
export let serverUrl: string;
export let testConnection: mysql.Connection;

// Configuración antes de todas las pruebas
export const setupTestEnvironment = async () => {
  // Crear servidor Apollo para pruebas
  server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Iniciar servidor en puerto de prueba
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      return { token };
    },
  });

  serverUrl = url;
  console.log(`🚀 Servidor de pruebas listo en ${url}`);

  // Configurar conexión de base de datos para pruebas
  testConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'astrocode_test',
    port: parseInt(process.env.DB_PORT || '3306')
  });
};

// Limpieza después de todas las pruebas
export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop();
  }
  if (testConnection) {
    await testConnection.end();
  }
};

// Limpiar datos de prueba
export const cleanupTestData = async () => {
  try {
    if (!testConnection) {
      console.warn('No hay conexión de base de datos para limpiar');
      return;
    }
    
    // Eliminar usuarios de prueba
    await testConnection.execute(
      "DELETE FROM usuarios WHERE correo_electronico LIKE '%test%'"
    );
    
    // Limpiar otras tablas relacionadas
    await testConnection.execute(
      "DELETE FROM progreso_usuario WHERE usuario_id IN (SELECT id FROM usuarios WHERE correo_electronico LIKE '%test%')"
    );
    
    await testConnection.execute(
      "DELETE FROM clicks_recursos WHERE usuario_id IN (SELECT id FROM usuarios WHERE correo_electronico LIKE '%test%')"
    );
    
    console.log('Datos de prueba limpiados');
  } catch (error) {
    console.error('Error limpiando datos de prueba:', error);
  }
};

// Datos de prueba comunes
export const testUsers = {
  newUser: {
    nombre_usuario: 'testuser',
    correo_electronico: 'test@example.com',
    contrasena: 'password123',
    nombre_completo: 'Usuario de Prueba'
  },
  existingUser: {
    nombre_usuario: 'existing',
    correo_electronico: 'existing@test.com',
    contrasena: 'password123',
    nombre_completo: 'Usuario Existente'
  },
  invalidEmail: {
    nombre_usuario: 'invalid',
    correo_electronico: 'aaa',
    contrasena: 'password123'
  }
};

export const testExercise = {
  id: '1',
  codigo: 'print("Hello World")',
  codigoIncorrecto: 'print("Wrong")',
  codigoConError: 'print("hola'
};