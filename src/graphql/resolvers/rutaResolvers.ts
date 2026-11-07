import { query } from '../../config/db';
import { Context } from '../errors';
import { rutaDeUsuario } from '../../services/ruta';

const CAMPOS_TAREA = `id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, prioridad, completado,
  tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, tipo, config`;

export const rutaResolvers = {
  Query: {
    ruta: async (_: any, __: any, context: Context) => {
      const ruta = await rutaDeUsuario(context.user);
      const ids = ruta.flatMap((p) => p.pasos.map((s) => s.tareaId)).filter((id): id is number => id !== null);
      const tareas = new Map<number, any>();
      if (ids.length) {
        for (const t of await query(`SELECT ${CAMPOS_TAREA} FROM tareas WHERE id = ANY($1)`, [ids])) {
          tareas.set(t.id, {
            ...t, puntosBase: t.puntos_base, puntosBonus: t.puntos_bonus,
            codigoBase: t.codigo_base, resultadoEsperado: t.resultado_esperado,
          });
        }
      }
      return ruta.map((p) => ({
        ...p,
        hechos: p.pasos.filter((s) => s.estado === 'hecho').length,
        total: p.pasos.length,
        pasos: p.pasos.map((s) => ({ ...s, tarea: s.tareaId !== null ? tareas.get(s.tareaId) || null : null })),
      }));
    },
  },
};
