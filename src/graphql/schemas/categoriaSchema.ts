import { gql } from 'apollo-server-express';

export const categoriaTypeDefs = gql`
  type Categoria {
    id: ID!
    nombre: String!
  }

  input CrearCategoriaInput {
    nombre: String!
  }

  input ActualizarCategoriaInput {
    nombre: String
  }

  extend type Query {
    # Obtener todas las categorías
    categorias: [Categoria!]!
    
    # Obtener una categoría por ID
    categoria(id: ID!): Categoria
    
    # Buscar categorías por nombre
    categoriasPorNombre(nombre: String!): [Categoria!]!
  }

  extend type Mutation {
    # Crear una nueva categoría
    crearCategoria(input: CrearCategoriaInput!): Categoria!
    
    # Actualizar una categoría existente
    actualizarCategoria(id: ID!, input: ActualizarCategoriaInput!): Categoria!
    
    # Eliminar una categoría
    eliminarCategoria(id: ID!): Boolean!
  }
`;