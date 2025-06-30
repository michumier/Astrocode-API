module.exports = {
  // Configuración específica para pruebas de integración
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/**/*.test.ts'],
  
  // Configuración de TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Configuración de tipos
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Configuración de módulos y resolución
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1'
  },
  
  // Configuración de transformación
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        types: ['jest', 'node']
      }
    }
  },
  
  // Configuración de timeouts
  testTimeout: 30000, // 30 segundos para pruebas de integración
  
  // Setup y teardown
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
  
  // Configuración de módulos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Configuración de coverage
  collectCoverage: true,
  coverageDirectory: '<rootDir>/../../coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '<rootDir>/../../src/**/*.{ts,tsx}',
    '!<rootDir>/../../src/**/*.d.ts',
    '!<rootDir>/../../src/db/**',
    '!<rootDir>/../../src/aux-bd/**'
  ],
  
  // Variables de entorno para pruebas
  setupFilesAfterEnv: ['<rootDir>/test/integration/jest.setup.ts'],
  
  // Configuración de módulos mock
  clearMocks: true,
  restoreMocks: true,
  
  // Configuración de reportes
  verbose: true,
  
  // Configuración de archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Configuración de transformaciones
  transformIgnorePatterns: [
    'node_modules/(?!(apollo-server-core|apollo-server-express)/)',
  ],
  
  // Configuración de resolución de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Configuración de reporters personalizados
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/integration',
        filename: 'integration-test-report.html',
        expand: true,
      },
    ],
  ],
};