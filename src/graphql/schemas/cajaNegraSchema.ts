import gql from 'graphql-tag';

export const cajaNegraTypeDefs = gql`
  # Ejecución paso a paso (caja negra)
  type TrazaEjecucion {
    # JSON en texto: [{ linea, evento, pila: [{ funcion, linea, vars }], salida, retorno?, excepcion? }]
    pasos: String!
    totalPasos: Int!
    # Salida completa del programa (cada paso guarda cuántos caracteres llevaba)
    salida: String!
    error: String
    # true si se cortó al llegar al máximo de pasos o de tamaño
    truncado: Boolean!
  }

  extend type Mutation {
    # Traza un programa cualquiera
    trazarEjecucion(codigo: String!, stdin: String): TrazaEjecucion!

    # Traza el código del alumno ejecutando uno de los tests VISIBLES de la tarea (índice entre los visibles)
    trazarTest(tareaId: ID!, codigo: String!, indiceTest: Int!): TrazaEjecucion!
  }
`;
