// Declaraciones de tipos para pruebas de integración

/// <reference types="jest" />
/// <reference types="node" />

// Asegurar que los tipos de Jest estén disponibles globalmente
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
    }
  }
}

// Tipos para Apollo Client
declare module '@apollo/client' {
  export * from '@apollo/client/index';
}

// Tipos para node-fetch
declare module 'node-fetch' {
  export default function fetch(
    url: string | Request,
    init?: RequestInit
  ): Promise<Response>;
}

export {};