import { query } from '../../config/db';
import { Context, requireAuth, UserInputError, ForbiddenError } from '../errors';
import { trazarCodigo, Traza } from '../../services/pythonRunner';
import { puedeAbrirTarea } from '../../services/sabotajes';

const paraGraphQL = (t: Traza) => ({
  pasos: JSON.stringify(t.pasos || []),
  totalPasos: (t.pasos || []).length,
  salida: t.salida || '',
  error: t.error || null,
  truncado: !!t.truncado,
});

export const cajaNegraResolvers = {
  Mutation: {
    trazarEjecucion: async (_: any, { codigo, stdin }: { codigo: string; stdin?: string }, context: Context) => {
      requireAuth(context, 'Debes iniciar sesión para usar la caja negra');
      return paraGraphQL(await trazarCodigo(codigo, stdin || ''));
    },

    trazarTest: async (
      _: any,
      { tareaId, codigo, indiceTest }: { tareaId: string; codigo: string; indiceTest: number },
      context: Context
    ) => {
      const usuario = requireAuth(context, 'Debes iniciar sesión para usar la caja negra');
      const tareas = await query('SELECT id, tipo, config FROM tareas WHERE id = ?', [tareaId]) as any[];
      const tarea = tareas[0];
      if (!tarea) throw new UserInputError('Tarea no encontrada');
      if (tarea.tipo === 'pilotaje') throw new UserInputError('Las misiones de pilotaje tienen su propio visor');
      if (!(await puedeAbrirTarea(usuario, tarea))) throw new ForbiddenError('No puedes abrir esta tarea');

      // Solo los tests visibles: de los ocultos no se puede ver nada
      const visibles = await query(
        'SELECT codigo_test, entrada FROM tests_tarea WHERE tarea_id = ? AND oculto = 0 ORDER BY orden, id',
        [tareaId]
      ) as any[];
      const test = visibles[Math.floor(indiceTest)];
      if (!test || indiceTest < 0) throw new UserInputError('Ese test no existe o no es visible');

      return paraGraphQL(await trazarCodigo(codigo, test.entrada || '', test.codigo_test || null));
    },
  },
};
