import gql from 'graphql-tag';
import { userTypeDefs } from './graphql/schemas/userSchema';
import { categoriaTypeDefs } from './graphql/schemas/categoriaSchema';
import { nivelTypeDefs } from './graphql/schemas/nivelSchema';
import { tareaTypeDefs } from './graphql/schemas/tareaSchema';
import { codeExecutionTypeDefs } from './graphql/schemas/codeExecutionSchema';
import { iaTypeDefs } from './graphql/schemas/iaSchema';
import { sabotajeTypeDefs } from './graphql/schemas/sabotajeSchema';
import { cajaNegraTypeDefs } from './graphql/schemas/cajaNegraSchema';

const baseTypeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [baseTypeDefs, userTypeDefs, categoriaTypeDefs, nivelTypeDefs, tareaTypeDefs, codeExecutionTypeDefs, iaTypeDefs, sabotajeTypeDefs, cajaNegraTypeDefs];