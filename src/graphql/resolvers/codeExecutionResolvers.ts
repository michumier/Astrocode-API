import { Context, requireAuth } from '../errors';
import { ejecutarPython, ExecutionResult } from '../../services/pythonRunner';

interface ExecuteCodeInput {
  sourceCode: string;
  languageId?: number;
  stdin?: string;
}

export const codeExecutionResolvers = {
  Mutation: {
    // Ejecuta código para "probar" sin corregir. Requiere sesión para que nadie use el servidor gratis
    executeCode: async (_: any, { input }: { input: ExecuteCodeInput }, context: Context): Promise<ExecutionResult> => {
      requireAuth(context, 'Debes iniciar sesión para ejecutar código');
      return ejecutarPython(input.sourceCode, input.stdin || '');
    },
  },
};
