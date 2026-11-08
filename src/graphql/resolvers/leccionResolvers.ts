import { query, transaction } from '../../config/db';
import { Context, ForbiddenError, UserInputError, requireAuth } from '../errors';
import { bloqueoDePaso, conquistarSiCompleto, rutaDeUsuario } from '../../services/ruta';

// Puntos de una lección (docs/TEMARIO.md): al completarla, y un extra si se acierta a la primera
export const PUNTOS_LECCION = 10;
export const PUNTOS_A_LA_PRIMERA = 5;

const buscar = async (id: string | number) => {
  const [fila] = await query('SELECT id, clave, titulo, bloques, pregunta FROM lecciones WHERE id = $1', [id]);
  if (!fila) throw new UserInputError('Lección no encontrada');
  return fila;
};

// El paso que viene después de esta lección en su planeta (con su título)
async function siguientePaso(usuario: any, leccionId: number) {
  const ruta = await rutaDeUsuario(usuario);
  for (const planeta of ruta) {
    const i = planeta.pasos.findIndex((s) => s.leccionId === leccionId);
    if (i < 0) continue;
    const s = planeta.pasos[i + 1];
    if (!s) return { planeta: planeta.nombre, siguiente: null };
    const [fila] = s.tareaId !== null
      ? await query('SELECT id, titulo FROM tareas WHERE id = $1', [s.tareaId])
      : await query('SELECT id, titulo FROM lecciones WHERE id = $1', [s.leccionId]);
    return { planeta: planeta.nombre, siguiente: fila ? { tipo: s.tipo, id: fila.id, titulo: fila.titulo } : null };
  }
  return { planeta: null, siguiente: null };
}

export const leccionResolvers = {
  Query: {
    leccion: async (_: any, { id }: { id: string }, context: Context) => {
      const usuario = requireAuth(context, 'Debes iniciar sesión para ver las lecciones');
      const fila = await buscar(id);
      const bloqueo = await bloqueoDePaso(usuario, { leccionId: fila.id });
      if (bloqueo) throw new ForbiddenError(bloqueo);

      const [progreso] = await query(
        'SELECT completada_el FROM lecciones_usuarios WHERE usuario_id = $1 AND leccion_id = $2',
        [usuario.id, fila.id]
      );
      const { planeta, siguiente } = await siguientePaso(usuario, fila.id);
      return {
        id: fila.id,
        titulo: fila.titulo,
        planeta,
        bloques: fila.bloques,
        pregunta: { codigo: fila.pregunta.codigo, opciones: fila.pregunta.opciones.map((o: any) => o.texto) },
        completada: !!progreso?.completada_el,
        siguiente,
      };
    },
  },

  Mutation: {
    responderLeccion: async (_: any, { leccionId, opcion }: { leccionId: string; opcion: number }, context: Context) => {
      const usuario = requireAuth(context, 'Debes iniciar sesión para responder');
      const fila = await buscar(leccionId);
      const bloqueo = await bloqueoDePaso(usuario, { leccionId: fila.id });
      if (bloqueo) throw new ForbiddenError(bloqueo);

      const { opciones, correcta: buena } = fila.pregunta;
      if (!Number.isInteger(opcion) || opcion < 0 || opcion >= opciones.length) {
        throw new UserInputError('Esa opción no existe');
      }
      const correcta = opcion === buena;
      const respuesta = {
        correcta,
        explicacion: opciones[opcion].explicacion,
        puntos: 0,
        yaCompletada: false,
        planetaConquistado: null as any,
      };

      const [progreso] = await query(
        'SELECT completada_el FROM lecciones_usuarios WHERE usuario_id = $1 AND leccion_id = $2',
        [usuario.id, fila.id]
      );
      if (progreso?.completada_el) return { ...respuesta, yaCompletada: true };

      if (!correcta) {
        // Se apunta el fallo: el extra de «a la primera» ya no se podrá ganar
        await query(
          `INSERT INTO lecciones_usuarios (usuario_id, leccion_id, fallos) VALUES ($1, $2, 1)
           ON CONFLICT (usuario_id, leccion_id) DO UPDATE SET fallos = lecciones_usuarios.fallos + 1
           WHERE lecciones_usuarios.completada_el IS NULL`,
          [usuario.id, fila.id]
        );
        return respuesta;
      }

      // Completar y sumar en la misma transacción. Si llegan dos aciertos a la vez, solo uno
      // cambia la fila (la condición completada_el IS NULL), así que los puntos se suman una vez.
      const puntos = await transaction(async (conn) => {
        const [hecha] = await conn.query(
          `INSERT INTO lecciones_usuarios (usuario_id, leccion_id, completada_el, puntos) VALUES ($1, $2, now(), $3)
           ON CONFLICT (usuario_id, leccion_id) DO UPDATE
             SET completada_el = now(),
                 puntos = $4 + CASE WHEN lecciones_usuarios.fallos = 0 THEN $5 ELSE 0 END
           WHERE lecciones_usuarios.completada_el IS NULL
           RETURNING puntos`,
          [usuario.id, fila.id, PUNTOS_LECCION + PUNTOS_A_LA_PRIMERA, PUNTOS_LECCION, PUNTOS_A_LA_PRIMERA]
        );
        if (!hecha) return null;
        await conn.query('UPDATE usuarios SET puntos = COALESCE(puntos, 0) + $1 WHERE id = $2', [hecha.puntos, usuario.id]);
        return hecha.puntos as number;
      });
      if (puntos === null) return { ...respuesta, yaCompletada: true };

      try {
        respuesta.planetaConquistado = await conquistarSiCompleto(usuario.id, { leccionId: fila.id });
      } catch (error) {
        console.error('No se pudo apuntar la conquista del planeta:', error);
      }
      return { ...respuesta, puntos };
    },
  },
};
