import gql from 'graphql-tag';

// Lecciones de la ruta (fase 12, docs/TEMARIO.md)
export const leccionTypeDefs = gql`
  type BloqueLeccion {
    # texto | codigo | error
    tipo: String!
    texto: String
    codigo: String
    # En los ejemplos: qué cambiar para experimentar
    pista: String
  }

  # La pregunta tal como la ve el alumno: nunca dice cuál es la correcta
  type PreguntaLeccion {
    codigo: String!
    opciones: [String!]!
  }

  type PasoSiguiente {
    # tarea | leccion
    tipo: String!
    id: ID!
    titulo: String!
  }

  type Leccion {
    id: ID!
    titulo: String!
    planeta: String
    bloques: [BloqueLeccion!]
    pregunta: PreguntaLeccion
    completada: Boolean
    # El paso que viene después en la ruta (null si es el último del planeta)
    siguiente: PasoSiguiente
  }

  type ResultadoLeccion {
    correcta: Boolean!
    # Por qué esa opción es (o no es) la buena
    explicacion: String!
    # +10 al completarla y +5 más si fue a la primera; 0 si ya estaba completada o has fallado
    puntos: Int!
    yaCompletada: Boolean!
    planetaConquistado: PlanetaConquistado
  }

  extend type PasoRuta {
    leccion: Leccion
  }

  extend type Query {
    leccion(id: ID!): Leccion
  }

  extend type Mutation {
    responderLeccion(leccionId: ID!, opcion: Int!): ResultadoLeccion!
  }
`;
