import { query } from '../../config/db';
import { GraphQLError } from 'graphql';

// Custom error classes for Apollo Server v4
class UserInputError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'BAD_USER_INPUT',
      },
    });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'FORBIDDEN',
      },
    });
  }
}

class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
}

// Context interface
interface Context {
  token?: string;
  user?: any;
}

interface CrearTareaInput {
  categoriaId: string;
  nivelId: string;
  titulo: string;
  descripcion: string;
  fechaVencimiento?: string;
  prioridad?: number;
  puntosBase?: number;
  tiempoFinalizacionId?: string;
  codigoBase?: string;
  resultadoEsperado?: string;
}

interface ActualizarTareaInput {
  categoriaId?: string;
  nivelId?: string;
  titulo?: string;
  descripcion?: string;
  fechaVencimiento?: string;
  prioridad?: number;
  completado?: boolean;
  puntosBase?: number;
  tiempoFinalizacionId?: string;
  codigoBase?: string;
  resultadoEsperado?: string;
}

interface FiltroTareasInput {
  categoriaId?: string;
  nivelId?: string;
  completado?: boolean;
  prioridad?: number;
}

export const tareaResolvers = {
  Tarea: {
    // Resolver para obtener la categoría de una tarea
    categoria: async (parent: any) => {
      try {
        const result = await query(
          'SELECT id, nombre FROM categorias WHERE id = ?',
          [parent.categoria_id]
        ) as any[];
        return result[0];
      } catch (error) {
        console.error('Error al obtener categoría de tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Resolver para obtener el nivel de una tarea
    nivel: async (parent: any) => {
      try {
        const result = await query(
          'SELECT id, nombre, puntos FROM niveles WHERE id = ?',
          [parent.nivel_id]
        ) as any[];
        return result[0];
      } catch (error) {
        console.error('Error al obtener nivel de tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },

  Query: {
    // Obtener todas las tareas con filtros opcionales
    tareas: async (_: any, { filtro }: { filtro?: FiltroTareasInput }) => {
      try {
        let sqlQuery = `
          SELECT t.id, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, 
                 t.fecha_vencimiento, t.prioridad, t.completado, 
                 t.tiempo_finalizacion_id, t.puntos_base, t.puntos_bonus,
                 t.codigo_base, t.resultado_esperado
          FROM tareas t
        `;
        const condiciones: string[] = [];
        const parametros: any[] = [];

        if (filtro) {
          if (filtro.categoriaId) {
            condiciones.push('t.categoria_id = ?');
            parametros.push(filtro.categoriaId);
          }

          if (filtro.nivelId) {
            condiciones.push('t.nivel_id = ?');
            parametros.push(filtro.nivelId);
          }

          if (filtro.completado !== undefined) {
            condiciones.push('t.completado = ?');
            parametros.push(filtro.completado);
          }

          if (filtro.prioridad) {
            condiciones.push('t.prioridad = ?');
            parametros.push(filtro.prioridad);
          }
        }

        if (condiciones.length > 0) {
          sqlQuery += ` WHERE ${condiciones.join(' AND ')}`;
        }

        sqlQuery += ' ORDER BY t.prioridad DESC, t.fecha_vencimiento ASC';

        const result = await query(sqlQuery, parametros) as any[];
        return result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado
        }));
      } catch (error) {
        console.error('Error al obtener tareas:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener una tarea por ID
    tarea: async (_: any, { id }: { id: string }) => {
      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE id = ?`,
          [id]
        ) as any[];
        
        if (result.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }
        
        const tarea = result[0];
         return {
           ...tarea,
           puntosBase: tarea.puntos_base,
           puntosBonus: tarea.puntos_bonus,
           codigoBase: tarea.codigo_base,
           resultadoEsperado: tarea.resultado_esperado
         };
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Error al obtener tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener tareas por categoría
    tareasPorCategoria: async (_: any, { categoriaId }: { categoriaId: string }) => {
      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE categoria_id = ? 
           ORDER BY prioridad DESC, fecha_vencimiento ASC`,
          [categoriaId]
        ) as any[];
        return result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado
        }));
      } catch (error) {
        console.error('Error al obtener tareas por categoría:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener tareas por nivel
    tareasPorNivel: async (_: any, { nivelId }: { nivelId: string }) => {
      try {
        console.log('=== DEBUG RESOLVER tareasPorNivel ===');
        console.log('nivelId recibido:', nivelId);
        
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE nivel_id = ? 
           ORDER BY prioridad DESC, fecha_vencimiento ASC`,
          [nivelId]
        ) as any[];
        
        console.log('Resultado de la consulta SQL:', result);
        console.log('Número de tareas encontradas:', result.length);
        
        if (result.length > 0) {
          console.log('Primera tarea - datos raw:');
          console.log('- id:', result[0].id);
          console.log('- titulo:', result[0].titulo);
          console.log('- codigo_base:', result[0].codigo_base);
          console.log('- resultado_esperado:', result[0].resultado_esperado);
          console.log('- tipo codigo_base:', typeof result[0].codigo_base);
          console.log('- tipo resultado_esperado:', typeof result[0].resultado_esperado);
        }
        
        const mappedResult = result.map(tarea => {
          const mapped = {
            ...tarea,
            puntosBase: tarea.puntos_base,
            puntosBonus: tarea.puntos_bonus,
            codigoBase: tarea.codigo_base,
            resultadoEsperado: tarea.resultado_esperado
          };
          
          // Log mapped task details for debugging
          // console.log('Tarea mapeada:', {
          //   id: mapped.id,
          //   titulo: mapped.titulo,
          //   codigoBase: mapped.codigoBase,
          //   resultadoEsperado: mapped.resultadoEsperado
          // });
          
          return mapped;
        });
        
        //console.log('=== FIN DEBUG RESOLVER ===');
        return mappedResult;
      } catch (error) {
        console.error('Error al obtener tareas por nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener tareas por prioridad
    tareasPorPrioridad: async (_: any, { prioridad }: { prioridad: number }) => {
      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE prioridad = ? 
           ORDER BY fecha_vencimiento ASC`,
          [prioridad]
        ) as any[];
        return result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado
        }));
      } catch (error) {
        console.error('Error al obtener tareas por prioridad:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener tareas completadas por el usuario actual
    tareasCompletadas: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para ver las tareas completadas');
      }

      try {
        const usuarioId = context.user.id;
        const result = await query(
          `SELECT t.id, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, t.fecha_vencimiento, 
                  t.prioridad, t.completado, t.tiempo_finalizacion_id, t.puntos_base, t.puntos_bonus,
                  t.codigo_base, t.resultado_esperado, n.nombre as nivel_nombre
           FROM tareas t 
           JOIN tareas_usuarios tu ON t.id = tu.tarea_id
           JOIN niveles n ON t.nivel_id = n.id
           WHERE tu.usuario_id = ?
           ORDER BY tu.completado_el DESC`
        , [usuarioId]) as any[];
        
        return result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado,
          nivel: {
            nombre: tarea.nivel_nombre
          }
        }));
      } catch (error) {
        console.error('Error al obtener tareas completadas:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener tareas pendientes
    tareasPendientes: async () => {
      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE completado = false 
           ORDER BY prioridad DESC, fecha_vencimiento ASC`
        ) as any[];
        return result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado
        }));
      } catch (error) {
        console.error('Error al obtener tareas pendientes:', error);
        throw new Error('Error interno del servidor');
      }
    },

    dailyChallenge: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para ver el reto diario');
      }

      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE categoria_id = 16 AND nivel_id = 4 AND fecha_vencimiento >= UTC_DATE() AND fecha_vencimiento < UTC_DATE() + INTERVAL 1 DAY
           ORDER BY RAND()
           LIMIT 1`
        ) as any[];

        if (result.length === 0) {
          return null;
        }

        const tarea = result[0];
        return {
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado
        };
      } catch (error) {
        console.error('Error al obtener el reto diario:', error);
        throw new Error('Error interno del servidor');
      }
    },

    esTareaCompletada: async (_: any, { tareaId }: { tareaId: string }, context: Context) => {
      // Verificar autenticación
      if (!context.user) {
        return false;
      }

      try {
        const usuarioId = context.user.id;
        const result = await query(
          'SELECT COUNT(*) as count FROM tareas_usuarios WHERE usuario_id = ? AND tarea_id = ?',
          [usuarioId, tareaId]
        ) as any[];

        return result[0].count > 0;
      } catch (error: any) {
        console.error('Error al verificar tarea completada:', error);
        return false;
      }
    },
  },

  Mutation: {
    // Crear una nueva tarea
    crearTarea: async (
      _: any,
      { input }: { input: CrearTareaInput },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para crear tareas');
      }

      const {
        categoriaId,
        nivelId,
        descripcion,
        fechaVencimiento,
        prioridad,
        puntosBase,
        tiempoFinalizacionId
      } = input;

      // Validar prioridad
      if (prioridad && (prioridad < 1 || prioridad > 5)) {
        throw new UserInputError('La prioridad debe estar entre 1 y 5');
      }

      // Validar puntos base
      if (puntosBase && puntosBase < 0) {
        throw new UserInputError('Los puntos base deben ser un número positivo');
      }

      try {
        // Verificar que la categoría existe
        const categoriaExists = await query(
          'SELECT id FROM categorias WHERE id = ?',
          [categoriaId]
        ) as any[];

        if (categoriaExists.length === 0) {
          throw new UserInputError('La categoría especificada no existe');
        }

        // Verificar que el nivel existe
        const nivelExists = await query(
          'SELECT id FROM niveles WHERE id = ?',
          [nivelId]
        ) as any[];

        if (nivelExists.length === 0) {
          throw new UserInputError('El nivel especificado no existe');
        }

        // Verificar tiempo de finalización si se proporciona
        if (tiempoFinalizacionId) {
          const tiempoExists = await query(
            'SELECT id FROM tiempos_finalizacion WHERE id = ?',
            [tiempoFinalizacionId]
          ) as any[];

          if (tiempoExists.length === 0) {
            throw new UserInputError('El tiempo de finalización especificado no existe');
          }
        }

        // Crear la nueva tarea
        const result = await query(
          `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                              prioridad, puntos_base, tiempo_finalizacion_id, codigo_base, resultado_esperado) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [categoriaId, nivelId, input.titulo || '', descripcion, fechaVencimiento, prioridad, puntosBase, tiempoFinalizacionId, input.codigoBase || '', input.resultadoEsperado || '']
        ) as any;

        // Obtener la tarea creada
        const newTarea = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE id = ?`,
          [result.insertId]
        ) as any[];

        return newTarea[0];
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Error al crear tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Actualizar una tarea existente
    actualizarTarea: async (
      _: any,
      { id, input }: { id: string; input: ActualizarTareaInput },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para actualizar tareas');
      }

      const {
        categoriaId,
        nivelId,
        descripcion,
        fechaVencimiento,
        prioridad,
        completado,
        puntosBase,
        tiempoFinalizacionId
      } = input;

      // Validar prioridad
      if (prioridad && (prioridad < 1 || prioridad > 5)) {
        throw new UserInputError('La prioridad debe estar entre 1 y 5');
      }

      // Validar puntos base
      if (puntosBase && puntosBase < 0) {
        throw new UserInputError('Los puntos base deben ser un número positivo');
      }

      try {
        // Verificar que la tarea existe
        const tareaExists = await query(
          'SELECT id FROM tareas WHERE id = ?',
          [id]
        ) as any[];

        if (tareaExists.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }

        // Verificar referencias si se proporcionan
        if (categoriaId) {
          const categoriaExists = await query(
            'SELECT id FROM categorias WHERE id = ?',
            [categoriaId]
          ) as any[];

          if (categoriaExists.length === 0) {
            throw new UserInputError('La categoría especificada no existe');
          }
        }

        if (nivelId) {
          const nivelExists = await query(
            'SELECT id FROM niveles WHERE id = ?',
            [nivelId]
          ) as any[];

          if (nivelExists.length === 0) {
            throw new UserInputError('El nivel especificado no existe');
          }
        }

        if (tiempoFinalizacionId) {
          const tiempoExists = await query(
            'SELECT id FROM tiempos_finalizacion WHERE id = ?',
            [tiempoFinalizacionId]
          ) as any[];

          if (tiempoExists.length === 0) {
            throw new UserInputError('El tiempo de finalización especificado no existe');
          }
        }

        // Construir la consulta de actualización dinámicamente
        const campos: string[] = [];
        const valores: any[] = [];

        if (categoriaId) {
          campos.push('categoria_id = ?');
          valores.push(categoriaId);
        }

        if (nivelId) {
          campos.push('nivel_id = ?');
          valores.push(nivelId);
        }

        if (descripcion) {
          campos.push('descripcion = ?');
          valores.push(descripcion);
        }

        if (fechaVencimiento !== undefined) {
          campos.push('fecha_vencimiento = ?');
          valores.push(fechaVencimiento);
        }

        if (prioridad) {
          campos.push('prioridad = ?');
          valores.push(prioridad);
        }

        if (completado !== undefined) {
          campos.push('completado = ?');
          valores.push(completado);
        }

        if (puntosBase !== undefined) {
          campos.push('puntos_base = ?');
          valores.push(puntosBase);
        }

        if (tiempoFinalizacionId !== undefined) {
          campos.push('tiempo_finalizacion_id = ?');
          valores.push(tiempoFinalizacionId);
        }

        if (input.titulo !== undefined) {
          campos.push('titulo = ?');
          valores.push(input.titulo);
        }

        if (input.codigoBase !== undefined) {
          campos.push('codigo_base = ?');
          valores.push(input.codigoBase);
        }

        if (input.resultadoEsperado !== undefined) {
          campos.push('resultado_esperado = ?');
          valores.push(input.resultadoEsperado);
        }

        if (campos.length === 0) {
          throw new UserInputError('Debes proporcionar al menos un campo para actualizar');
        }

        valores.push(id);
        const updateQuery = `UPDATE tareas SET ${campos.join(', ')} WHERE id = ?`;

        await query(updateQuery, valores);

        // Obtener la tarea actualizada
        const updatedTarea = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado
           FROM tareas WHERE id = ?`,
          [id]
        ) as any[];

        return updatedTarea[0];
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Error al actualizar tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Marcar tarea como completada
    // Eliminar una tarea
    eliminarTarea: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para eliminar tareas');
      }

      try {
        // Verificar que la tarea existe
        const tareaExists = await query(
          'SELECT id FROM tareas WHERE id = ?',
          [id]
        ) as any[];

        if (tareaExists.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }

        // Verificar si hay registros en tareas_usuarios
        const associatedUserTasks = await query(
          'SELECT usuario_id FROM tareas_usuarios WHERE tarea_id = ? LIMIT 1',
          [id]
        ) as any[];

        if (associatedUserTasks.length > 0) {
          throw new UserInputError('No se puede eliminar la tarea porque tiene registros de usuarios asociados');
        }

        // Eliminar la tarea
        const result = await query(
          'DELETE FROM tareas WHERE id = ?',
          [id]
        ) as any;

        return result.affectedRows > 0;
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Error al eliminar tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    completarTarea: async (
      _: any,
      { tareaId, tiempoCompletado }: { tareaId: string; tiempoCompletado: number },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para completar una tarea');
      }

      try {
        const usuarioId = context.user.id;

        // Verificar si la tarea ya está completada por este usuario
        const tareaCompletada = await query(
          'SELECT * FROM tareas_usuarios WHERE usuario_id = ? AND tarea_id = ?',
          [usuarioId, tareaId]
        ) as any[];

        if (tareaCompletada.length > 0) {
          throw new UserInputError('Esta tarea ya ha sido completada');
        }

        // Obtener información de la tarea
        const tareaInfo = await query(
          'SELECT t.*, n.puntos as puntos_nivel FROM tareas t JOIN niveles n ON t.nivel_id = n.id WHERE t.id = ?',
          [tareaId]
        ) as any[];

        if (tareaInfo.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }

        const tarea = tareaInfo[0];
        const puntosBase = tarea.puntos_base || tarea.puntos_nivel;
        const puntosBonus = tarea.puntos_bonus || 0;
        const puntosTotales = puntosBase + puntosBonus;

        // Convertir tiempo a formato TIME (HH:MM:SS)
        const horas = Math.floor(tiempoCompletado / 3600);
        const minutos = Math.floor((tiempoCompletado % 3600) / 60);
        const segundos = tiempoCompletado % 60;
        const tiempoFormateado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

        // Insertar en tareas_usuarios
        await query(
          `INSERT INTO tareas_usuarios (usuario_id, tarea_id, tiempo_completado, puntos_base, puntos_bonus, puntos_totales) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [usuarioId, tareaId, tiempoFormateado, puntosBase, puntosBonus, puntosTotales]
        );

        // Actualizar puntos del usuario
        await query(
          'UPDATE usuarios SET puntos = puntos + ? WHERE id = ?',
          [puntosTotales, usuarioId]
        );

        return {
          success: true,
          puntos: puntosTotales,
          tiempo: tiempoFormateado,
          mensaje: `¡Felicidades! Has completado la tarea "${tarea.titulo}" y ganado ${puntosTotales} puntos.`
        };

      } catch (error: any) {
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
        console.error('Error al completar tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },
};