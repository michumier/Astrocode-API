import { GraphQLError } from 'graphql';

// Errores personalizados para Apollo Server v4
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

export class UserInputError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'BAD_USER_INPUT' } });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'FORBIDDEN' } });
  }
}

export interface Context {
  token?: string;
  user?: any;
}

// Lanza si no hay usuario autenticado
export const requireAuth = (context: Context, mensaje = 'Debes estar autenticado para realizar esta acción') => {
  if (!context.user) {
    throw new AuthenticationError(mensaje);
  }
  return context.user;
};

// Lanza si el usuario no es administrador
export const requireAdmin = (context: Context) => {
  const user = requireAuth(context);
  if (user.rol !== 'admin') {
    throw new ForbiddenError('Solo un administrador puede realizar esta acción');
  }
  return user;
};

// Los IDs llegan como string desde GraphQL y como number desde la BD
export const mismoId = (a: string | number, b: string | number) => String(a) === String(b);
