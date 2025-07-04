module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};