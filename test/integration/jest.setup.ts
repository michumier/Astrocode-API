import * as dotenv from 'dotenv';
import '@types/jest';

// Cargar variables de entorno para pruebas
dotenv.config({ path: '.env.test' });

// Configurar timeout global para Jest
jest.setTimeout(30000);

// Configuración global para todas las pruebas
beforeAll(() => {
  // Configurar variables de entorno por defecto si no existen
  if (!process.env.DB_HOST) {
    process.env.DB_HOST = 'localhost';
  }
  if (!process.env.DB_USER) {
    process.env.DB_USER = 'root';
  }
  if (!process.env.DB_PASSWORD) {
    process.env.DB_PASSWORD = '';
  }
  if (!process.env.DB_NAME) {
    process.env.DB_NAME = 'astrocode_test';
  }
  if (!process.env.DB_PORT) {
    process.env.DB_PORT = '3306';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_jwt_secret_key';
  }
  
  console.log('🔧 Configuración de pruebas de integración cargada');
});

// Configuración de timeouts extendidos para pruebas de integración
jest.setTimeout(30000);

// Manejo de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configuración de fetch para Node.js
if (!global.fetch) {
  const fetch = require('node-fetch');
  global.fetch = fetch;
  global.Headers = fetch.Headers;
  global.Request = fetch.Request;
  global.Response = fetch.Response;
}

// Configuración de console para pruebas
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filtrar errores conocidos de Apollo/GraphQL durante pruebas
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Cannot query field') ||
    message.includes('Unknown directive') ||
    message.includes('Field "') && message.includes('" is not defined')
  )) {
    // Silenciar estos errores durante las pruebas
    return;
  }
  originalConsoleError.apply(console, args);
};

// Configuración de Apollo Client para pruebas
export const apolloTestConfig = {
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all' as const,
    },
    query: {
      errorPolicy: 'all' as const,
    },
    mutate: {
      errorPolicy: 'all' as const,
    },
  },
};

// Utilidades para pruebas
export const testUtils = {
  // Esperar un tiempo determinado
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generar email único para pruebas
  generateTestEmail: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`,
  
  // Generar nombre de usuario único
  generateTestUsername: () => `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  
  // Limpiar string para comparaciones
  normalizeString: (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' '),
  
  // Verificar si una URL es válida
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Generar código Python de prueba
  generateTestCode: (type: 'valid' | 'invalid' | 'syntax_error') => {
    switch (type) {
      case 'valid':
        return 'print("Hello, World!")';
      case 'invalid':
        return 'print("Wrong output")';
      case 'syntax_error':
        return 'print("Missing quote';
      default:
        return 'print("Default test code")';
    }
  }
};

console.log('✅ Configuración de Jest para pruebas de integración completada');