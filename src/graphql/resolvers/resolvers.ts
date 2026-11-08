import { userResolvers, getUsuarioFromToken } from './userResolvers';
import { categoriaResolvers } from './categoriaResolvers';
import { nivelResolvers } from './nivelResolvers';
import { tareaResolvers } from './tareaResolvers';
import { codeExecutionResolvers } from './codeExecutionResolvers';
import { iaResolvers } from './iaResolvers';
import { sabotajeResolvers } from './sabotajeResolvers';
import { cajaNegraResolvers } from './cajaNegraResolvers';
import { rutaResolvers } from './rutaResolvers';
import { leccionResolvers } from './leccionResolvers';
import { mergeResolvers } from '@graphql-tools/merge';

const baseResolvers = {
  Query: {
    hello: () => 'Hello World!'
  },
  Mutation: {
    _empty: () => 'Empty mutation'
  }
};

export const resolvers = mergeResolvers([baseResolvers, userResolvers, categoriaResolvers, nivelResolvers, tareaResolvers, codeExecutionResolvers, iaResolvers, sabotajeResolvers, cajaNegraResolvers, rutaResolvers, leccionResolvers]);

export { getUsuarioFromToken };
