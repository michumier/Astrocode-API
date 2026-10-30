import { query, ejecutar } from '../../config/db';
import { Context, requireAuth, requireAdmin, UserInputError } from '../errors';
import { generarSabotajes, publicarSabotaje } from '../../services/sabotajes';

const mapSabotaje = (s: any) => ({
  id: s.id,
  tareaOriginalId: s.tarea_original_id,
  tareaId: s.tarea_id,
  operador: s.operador,
  descripcion: s.descripcion,
  linea: s.linea,
  lineasCambiadas: s.lineas_cambiadas,
  diff: s.diff,
  codigo: s.codigo,
  contexto: s.contexto,
  dificultad: s.dificultad,
  testsFallidos: s.tests_fallidos,
  testsTotales: s.tests_totales,
  origen: s.origen,
  creadoEl: new Date(s.creado_el).toISOString(),
});

// Los errores de validación del servicio (sin solución, pocos tests...) se devuelven como BAD_USER_INPUT
const comoErrorDeUsuario = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (error.extensions) throw error;
    throw new UserInputError(error.message);
  }
};

export const sabotajeResolvers = {
  Query: {
    tareasSaboteables: async (_: any, __: any, context: Context) => {
      requireAdmin(context);
      const filas = await query(
        `SELECT * FROM (
           SELECT t.id, t.titulo,
                  (SELECT COUNT(*) FROM tests_tarea tt WHERE tt.tarea_id = t.id) AS tests,
                  (SELECT COUNT(*) FROM sabotajes s WHERE s.tarea_original_id = t.id) AS sabotajes,
                  (SELECT COUNT(*) FROM sabotajes s WHERE s.tarea_original_id = t.id AND s.tarea_id IS NOT NULL) AS publicados
           FROM tareas t
           WHERE t.tipo = 'codigo' AND t.solucion IS NOT NULL AND t.solucion <> ''
         ) saboteables
         WHERE tests >= 2
         ORDER BY titulo`
      ) as any[];
      return filas.map((f) => ({ ...f, tests: Number(f.tests), sabotajes: Number(f.sabotajes), publicados: Number(f.publicados) }));
    },

    sabotajesDeTarea: async (_: any, { tareaId }: { tareaId: string }, context: Context) => {
      requireAdmin(context);
      const filas = await query('SELECT * FROM sabotajes WHERE tarea_original_id = $1 ORDER BY id DESC', [tareaId]) as any[];
      return filas.map(mapSabotaje);
    },

    salaDeMaquinas: async (_: any, __: any, context: Context) => {
      const usuario = requireAuth(context);
      const filas = await query(
        `SELECT s.tarea_id, t.titulo, s.contexto, s.dificultad, o.titulo AS original_titulo,
                EXISTS(SELECT 1 FROM tareas_usuarios tu WHERE tu.usuario_id = $1 AND tu.tarea_id = s.tarea_original_id) AS desbloqueado,
                EXISTS(SELECT 1 FROM tareas_usuarios tu WHERE tu.usuario_id = $2 AND tu.tarea_id = s.tarea_id) AS completada
         FROM sabotajes s
         JOIN tareas t ON t.id = s.tarea_id
         JOIN tareas o ON o.id = s.tarea_original_id
         WHERE s.tarea_id IS NOT NULL
         ORDER BY completada ASC, COALESCE(array_position(ARRAY['facil', 'media', 'dificil'], s.dificultad::text), 0), s.id`,
        [usuario.id, usuario.id]
      ) as any[];
      const disponibles = filas.filter((f) => f.desbloqueado);
      return {
        disponibles: disponibles.map((f) => ({
          tareaId: f.tarea_id,
          titulo: f.titulo,
          contexto: f.contexto,
          dificultad: f.dificultad,
          completada: !!f.completada,
          tareaOriginalTitulo: f.original_titulo,
        })),
        bloqueados: filas.length - disponibles.length,
      };
    },
  },

  Mutation: {
    generarSabotajes: async (
      _: any,
      { tareaId, cantidad = 5, usarIa = false }: { tareaId: string; cantidad?: number; usarIa?: boolean },
      context: Context
    ) => {
      requireAdmin(context);
      const ids = await comoErrorDeUsuario(() => generarSabotajes(tareaId, cantidad, usarIa));
      if (ids.length === 0) return [];
      const filas = await query('SELECT * FROM sabotajes WHERE id = ANY($1) ORDER BY id', [ids]) as any[];
      return filas.map(mapSabotaje);
    },

    publicarSabotaje: async (_: any, { id, contexto }: { id: string; contexto?: string }, context: Context) => {
      requireAdmin(context);
      const tareaId = await comoErrorDeUsuario(() => publicarSabotaje(id, contexto));
      const filas = await query(
        `SELECT id, categoria_id, nivel_id, titulo, descripcion, puntos_base, puntos_bonus, codigo_base,
                resultado_esperado, tipo, config FROM tareas WHERE id = $1`,
        [tareaId]
      ) as any[];
      const t = filas[0];
      return { ...t, puntosBase: t.puntos_base, puntosBonus: t.puntos_bonus, codigoBase: t.codigo_base, resultadoEsperado: t.resultado_esperado };
    },

    descartarSabotaje: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);
      if ((await ejecutar('DELETE FROM sabotajes WHERE id = $1 AND tarea_id IS NULL', [id])) === 0) {
        throw new UserInputError('No existe o ya está publicado (los publicados no se descartan)');
      }
      return true;
    },
  },
};
