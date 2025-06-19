import { gql } from 'apollo-server-express';

export const nivelTypeDefs = gql`
  type Nivel {
    id: ID!
    nombre: String!
    puntos: Int!
  }

  input CrearNivelInput {
    nombre: String!
    puntos: Int!
  }

  input ActualizarNivelInput {
    nombre: String
    puntos: Int
  }

  extend type Query {
    # Obtener todos los niveles
    niveles: [Nivel!]!
    
    # Obtener un nivel por ID
    nivel(id: ID!): Nivel
    
    # Obtener niveles ordenados por puntos
    nivelesPorPuntos: [Nivel!]!
    
    # Buscar niveles por nombre
    nivelesPorNombre(nombre: String!): [Nivel!]!
  }

  extend type Mutation {
    # Crear un nuevo nivel
    crearNivel(input: CrearNivelInput!): Nivel!
    
    # Actualizar un nivel existente
    actualizarNivel(id: ID!, input: ActualizarNivelInput!): Nivel!
    
    # Eliminar un nivel
    eliminarNivel(id: ID!): Boolean!
  }
`;