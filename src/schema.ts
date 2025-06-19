import { gql } from 'apollo-server-express';
import { userTypeDefs } from './graphql/schemas/userSchema';
import { categoriaTypeDefs } from './graphql/schemas/categoriaSchema';
import { nivelTypeDefs } from './graphql/schemas/nivelSchema';
import { tareaTypeDefs } from './graphql/schemas/tareaSchema';

const baseTypeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [baseTypeDefs, userTypeDefs, categoriaTypeDefs, nivelTypeDefs, tareaTypeDefs];