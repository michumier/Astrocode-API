import gql from 'graphql-tag';

export const iaTypeDefs = gql`
  type Pista {
    pista: String!
    nivel: Int!
    restantesHoy: Int!
  }

  type TestGenerado {
    descripcion: String!
    codigoTest: String!
    salidaEsperada: String!
    oculto: Boolean!
  }

  type EjercicioGenerado {
    titulo: String!
    descripcion: String!
    codigoBase: String!
    solucion: String!
    resultadoEsperado: String!
    tests: [TestGenerado!]!
    testsGenerados: Int!
    avisos: [String!]!
  }

  extend type Query {
    # ¿Hay una API key de IA configurada?
    iaDisponible: Boolean!

    # Pistas de IA que le quedan hoy al usuario autenticado
    pistasRestantesHoy: Int!
  }

  extend type Mutation {
    # Pista del tutor de IA (nivel 1 = conceptual ... 3 = muy concreta). Nunca da la solución.
    pedirPista(tareaId: ID!, codigo: String!, salida: String, nivel: Int): Pista!

    # Borrador de ejercicio generado por IA con tests verificados (solo admin; no se guarda)
    generarEjercicio(tema: String!, nivelId: ID!, categoriaId: ID!): EjercicioGenerado!
  }
`;
