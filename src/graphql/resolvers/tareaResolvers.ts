import { query, ejecutar, transaction, esDuplicado, HOY_UTC } from '../../config/db';
import { corregirTarea } from '../../services/correccion';
import { clasificarError } from '../../services/errores';
import { corregirMision, comoEjecucion, tipoErrorMision, misionParaGraphQL, infoMision, probarEscenario, esSimulacion, materialMision } from '../../services/misiones';
import { GraphQLError } from 'graphql';
import { UserInputError, ForbiddenError, Context, requireAuth, requireAdmin } from '../errors';
import { puedeAbrirTarea, sabotajePorTarea, esArregloQuirurgico } from '../../services/sabotajes';

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
  solucion?: string;
  tests?: TestTareaInput[];
}

interface TestTareaInput {
  descripcion?: string;
  codigoTest?: string;
  entrada?: string;
  salidaEsperada: string;
  oculto?: boolean;
}

// Convierte una fila de la BD (snake_case) al tipo Tarea de GraphQL (camelCase)
const mapTarea = (tarea: any) => ({
  ...tarea,
  puntosBase: tarea.puntos_base,
  puntosBonus: tarea.puntos_bonus,
  codigoBase: tarea.codigo_base,
  resultadoEsperado: tarea.resultado_esperado,
});

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

// Índice del reto de hoy dentro de la lista de retos diarios
const indiceRetoDelDia = async (): Promise<number> => {
  const filas = await query(
    `SELECT COUNT(*) AS total FROM tareas t JOIN categorias c ON t.categoria_id = c.id WHERE c.nombre = 'Reto Diario' AND t.tipo <> 'sabotaje'`
  ) as any[];
  const total = Number(filas[0]?.total || 0);
  if (total === 0) return 0;
  const diasDesdeEpoch = Math.floor(Date.now() / 86400000);
  return diasDesdeEpoch % total;
};

export const tareaResolvers = {
  Tarea: {
    // Las tareas antiguas o construidas a mano pueden no traer el tipo
    tipo: (parent: any) => parent.tipo || 'codigo',
    // Misiones y retos: id y escenarios visibles (sin semillas ni datos de los ocultos)
    mision: (parent: any) => (esSimulacion(parent) && parent.config ? infoMision(parent) : null),
    formato: (parent: any) => (parent.tipo === 'reto' && parent.config ? infoMision(parent).formato : null),
    // Ambientación de los sabotajes (guardada en config)
    contexto: (parent: any) => {
      if (!parent.config) return null;
      const config = typeof parent.config === 'string' ? JSON.parse(parent.config) : parent.config;
      return config?.contexto || null;
    },

    // Resolver para obtener la categoría de una tarea
    categoria: async (parent: any) => {
      try {
        const result = await query(
          'SELECT id, nombre FROM categorias WHERE id = $1',
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
          'SELECT id, nombre, puntos FROM niveles WHERE id = $1',
          [parent.nivel_id]
        ) as any[];
        return result[0];
      } catch (error) {
        console.error('Error al obtener nivel de tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },

  InfoMision: {
    funcion: async (parent: any) => (await materialMision(parent._tarea)).funcion,
    material: async (parent: any) => (await materialMision(parent._tarea)).material,
  },

  Query: {
    // Obtener todas las tareas con filtros opcionales
    tareas: async (_: any, { filtro }: { filtro?: FiltroTareasInput }) => {
      try {
        let sqlQuery = `
          SELECT t.id, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, 
                 t.fecha_vencimiento, t.prioridad, t.completado, 
                 t.tiempo_finalizacion_id, t.puntos_base, t.puntos_bonus,
                 t.codigo_base, t.resultado_esperado, t.tipo
          FROM tareas t
        `;
        // Los sabotajes solo se ven en la sala de máquinas (se desbloquean aparte)
        const condiciones: string[] = ["t.tipo <> 'sabotaje'"];
        const parametros: any[] = [];

        if (filtro) {
          if (filtro.categoriaId) {
            parametros.push(filtro.categoriaId);
            condiciones.push(`t.categoria_id = $${parametros.length}`);
          }

          if (filtro.nivelId) {
            parametros.push(filtro.nivelId);
            condiciones.push(`t.nivel_id = $${parametros.length}`);
          }

          if (filtro.completado !== undefined) {
            parametros.push(filtro.completado);
            condiciones.push(`t.completado = $${parametros.length}`);
          }

          if (filtro.prioridad) {
            parametros.push(filtro.prioridad);
            condiciones.push(`t.prioridad = $${parametros.length}`);
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
    tarea: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const result = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE id = $1`,
          [id]
        ) as any[];
        
        if (result.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }
        
        const tarea = result[0];
        if (!(await puedeAbrirTarea(context.user, tarea))) {
          throw new ForbiddenError('Completa primero el ejercicio original para desbloquear este sabotaje');
        }
         return {
           ...tarea,
           puntosBase: tarea.puntos_base,
           puntosBonus: tarea.puntos_bonus,
           codigoBase: tarea.codigo_base,
           resultadoEsperado: tarea.resultado_esperado
         };
      } catch (error) {
        if (error instanceof GraphQLError) {
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
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE categoria_id = $1 AND tipo <> 'sabotaje' 
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
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE nivel_id = $1 AND tipo <> 'sabotaje' 
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
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE prioridad = $1 AND tipo <> 'sabotaje' 
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
      requireAuth(context, 'Debes estar autenticado para ver las tareas completadas');

      try {
        const usuarioId = context.user.id;
        const result = await query(
          `SELECT t.id, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, t.fecha_vencimiento, 
                  t.prioridad, t.completado, t.tiempo_finalizacion_id, t.puntos_base, t.puntos_bonus,
                  t.codigo_base, t.resultado_esperado, t.tipo, n.nombre as nivel_nombre
           FROM tareas t 
           JOIN tareas_usuarios tu ON t.id = tu.tarea_id
           JOIN niveles n ON t.nivel_id = n.id
           WHERE tu.usuario_id = $1
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
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE completado = false AND tipo <> 'sabotaje' 
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

    misIntentos: async (_: any, { tareaId, limite = 20 }: { tareaId: string; limite?: number }, context: Context) => {
      const usuario = requireAuth(context);
      const limiteSeguro = Math.min(Math.max(Math.floor(limite), 1), 100);
      const filas = await query(
        `SELECT id, codigo, correcto, tests_superados, tests_totales, tipo_error, segundos_en_tarea, creado_el
         FROM intentos WHERE usuario_id = $1 AND tarea_id = $2
         ORDER BY creado_el DESC, id DESC LIMIT ${limiteSeguro}`,
        [usuario.id, tareaId]
      ) as any[];
      return filas.map((f) => ({
        id: f.id,
        codigo: f.codigo,
        correcto: !!f.correcto,
        testsSuperados: f.tests_superados,
        testsTotales: f.tests_totales,
        tipoError: f.tipo_error,
        segundosEnTarea: f.segundos_en_tarea,
        creadoEl: new Date(f.creado_el).toISOString(),
      }));
    },

    dailyChallenge: async (_: any, __: any, context: Context) => {
      requireAuth(context, 'Debes estar autenticado para ver el reto diario');

      try {
        const campos = `t.id, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, t.fecha_vencimiento,
                  t.prioridad, t.completado, t.tiempo_finalizacion_id, t.puntos_base, t.puntos_bonus,
                  t.codigo_base, t.resultado_esperado, t.tipo, t.config`;

        // 1º: un reto programado para hoy
        let result = await query(
          `SELECT ${campos} FROM tareas t JOIN categorias c ON t.categoria_id = c.id
           WHERE c.nombre = 'Reto Diario' AND t.tipo <> 'sabotaje' AND t.fecha_vencimiento = ${HOY_UTC}
           ORDER BY t.id LIMIT 1`
        ) as any[];

        // 2º: si no hay ninguno programado, rotar entre los retos existentes según el día
        // (el mismo reto para todos durante todo el día)
        if (result.length === 0) {
          result = await query(
            `SELECT ${campos} FROM tareas t JOIN categorias c ON t.categoria_id = c.id
             WHERE c.nombre = 'Reto Diario' AND t.tipo <> 'sabotaje'
             ORDER BY t.id
             LIMIT 1 OFFSET $1`,
            [String(await indiceRetoDelDia())]
          ) as any[];
        }

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
          'SELECT COUNT(*) as count FROM tareas_usuarios WHERE usuario_id = $1 AND tarea_id = $2',
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
      requireAdmin(context);

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
          'SELECT id FROM categorias WHERE id = $1',
          [categoriaId]
        ) as any[];

        if (categoriaExists.length === 0) {
          throw new UserInputError('La categoría especificada no existe');
        }

        // Verificar que el nivel existe
        const nivelExists = await query(
          'SELECT id FROM niveles WHERE id = $1',
          [nivelId]
        ) as any[];

        if (nivelExists.length === 0) {
          throw new UserInputError('El nivel especificado no existe');
        }

        // Verificar tiempo de finalización si se proporciona
        if (tiempoFinalizacionId) {
          const tiempoExists = await query(
            'SELECT id FROM tiempos_finalizacion WHERE id = $1',
            [tiempoFinalizacionId]
          ) as any[];

          if (tiempoExists.length === 0) {
            throw new UserInputError('El tiempo de finalización especificado no existe');
          }
        }

        // Crear la nueva tarea y sus tests en una transacción
        const insertId = await transaction(async (conn) => {
          const [nueva] = await conn.query(
            `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento,
                                prioridad, puntos_base, tiempo_finalizacion_id, codigo_base, resultado_esperado, solucion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`,
            [categoriaId, nivelId, input.titulo || '', descripcion, fechaVencimiento ?? null, prioridad ?? null,
             puntosBase ?? null, tiempoFinalizacionId ?? null, input.codigoBase || '', input.resultadoEsperado || '',
             input.solucion ?? null]
          );

          for (const [orden, test] of (input.tests || []).entries()) {
            await conn.query(
              `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, entrada, salida_esperada, oculto, orden)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [nueva.id, test.descripcion || '', test.codigoTest ?? null, test.entrada ?? null,
               test.salidaEsperada, !!test.oculto, orden]
            );
          }
          return nueva.id;
        });

        // Obtener la tarea creada
        const newTarea = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE id = $1`,
          [insertId]
        ) as any[];

        return mapTarea(newTarea[0]);
      } catch (error) {
        if (error instanceof GraphQLError) {
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
      requireAdmin(context);

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
          'SELECT id FROM tareas WHERE id = $1',
          [id]
        ) as any[];

        if (tareaExists.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }

        // Verificar referencias si se proporcionan
        if (categoriaId) {
          const categoriaExists = await query(
            'SELECT id FROM categorias WHERE id = $1',
            [categoriaId]
          ) as any[];

          if (categoriaExists.length === 0) {
            throw new UserInputError('La categoría especificada no existe');
          }
        }

        if (nivelId) {
          const nivelExists = await query(
            'SELECT id FROM niveles WHERE id = $1',
            [nivelId]
          ) as any[];

          if (nivelExists.length === 0) {
            throw new UserInputError('El nivel especificado no existe');
          }
        }

        if (tiempoFinalizacionId) {
          const tiempoExists = await query(
            'SELECT id FROM tiempos_finalizacion WHERE id = $1',
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
          valores.push(categoriaId);
          campos.push(`categoria_id = $${valores.length}`);
        }

        if (nivelId) {
          valores.push(nivelId);
          campos.push(`nivel_id = $${valores.length}`);
        }

        if (descripcion) {
          valores.push(descripcion);
          campos.push(`descripcion = $${valores.length}`);
        }

        if (fechaVencimiento !== undefined) {
          valores.push(fechaVencimiento);
          campos.push(`fecha_vencimiento = $${valores.length}`);
        }

        if (prioridad) {
          valores.push(prioridad);
          campos.push(`prioridad = $${valores.length}`);
        }

        if (completado !== undefined) {
          valores.push(completado);
          campos.push(`completado = $${valores.length}`);
        }

        if (puntosBase !== undefined) {
          valores.push(puntosBase);
          campos.push(`puntos_base = $${valores.length}`);
        }

        if (tiempoFinalizacionId !== undefined) {
          valores.push(tiempoFinalizacionId);
          campos.push(`tiempo_finalizacion_id = $${valores.length}`);
        }

        if (input.titulo !== undefined) {
          valores.push(input.titulo);
          campos.push(`titulo = $${valores.length}`);
        }

        if (input.codigoBase !== undefined) {
          valores.push(input.codigoBase);
          campos.push(`codigo_base = $${valores.length}`);
        }

        if (input.resultadoEsperado !== undefined) {
          valores.push(input.resultadoEsperado);
          campos.push(`resultado_esperado = $${valores.length}`);
        }

        if (campos.length === 0) {
          throw new UserInputError('Debes proporcionar al menos un campo para actualizar');
        }

        valores.push(id);
        const updateQuery = `UPDATE tareas SET ${campos.join(', ')} WHERE id = $${valores.length}`;

        await query(updateQuery, valores);

        // Obtener la tarea actualizada
        const updatedTarea = await query(
          `SELECT id, categoria_id, nivel_id, titulo, descripcion, fecha_vencimiento, 
                  prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus,
                  codigo_base, resultado_esperado, tipo, config
           FROM tareas WHERE id = $1`,
          [id]
        ) as any[];

        return updatedTarea[0];
      } catch (error) {
        if (error instanceof GraphQLError) {
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
      requireAdmin(context);

      try {
        // Verificar que la tarea existe
        const tareaExists = await query(
          'SELECT id FROM tareas WHERE id = $1',
          [id]
        ) as any[];

        if (tareaExists.length === 0) {
          throw new UserInputError('Tarea no encontrada');
        }

        // Verificar si hay registros en tareas_usuarios
        const associatedUserTasks = await query(
          'SELECT usuario_id FROM tareas_usuarios WHERE tarea_id = $1 LIMIT 1',
          [id]
        ) as any[];

        if (associatedUserTasks.length > 0) {
          throw new UserInputError('No se puede eliminar la tarea porque tiene registros de usuarios asociados');
        }

        // Eliminar la tarea
        return (await ejecutar('DELETE FROM tareas WHERE id = $1', [id])) > 0;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        console.error('Error al eliminar tarea:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Corrige la solución EN EL SERVIDOR: ejecuta el código, compara con el resultado
    // esperado y solo entonces suma los puntos. El cliente ya no decide si está bien.
    probarMision: async (
      _: any,
      { tareaId, codigo, escenario = 0 }: { tareaId: string; codigo: string; escenario?: number },
      context: Context
    ) => {
      const usuario = requireAuth(context, 'Debes estar autenticado para lanzar una misión');
      const filas = await query('SELECT id, tipo, config FROM tareas WHERE id = $1', [tareaId]) as any[];
      const tarea = filas[0];
      if (!tarea) throw new UserInputError('Tarea no encontrada');
      if (!esSimulacion(tarea)) throw new UserInputError('Esta tarea no es una misión ni un reto');
      if (!(await puedeAbrirTarea(usuario, tarea))) throw new ForbiddenError('No puedes abrir esta tarea');
      return misionParaGraphQL(await probarEscenario(tarea, codigo, escenario));
    },

    enviarSolucion: async (
      _: any,
      { tareaId, codigo, tiempoCompletado }: { tareaId: string; codigo: string; tiempoCompletado: number },
      context: Context
    ) => {
      const usuario = requireAuth(context, 'Debes estar autenticado para enviar una solución');

      const tareaInfo = await query(
        'SELECT t.*, n.puntos as puntos_nivel FROM tareas t JOIN niveles n ON t.nivel_id = n.id WHERE t.id = $1',
        [tareaId]
      ) as any[];

      if (tareaInfo.length === 0) {
        throw new UserInputError('Tarea no encontrada');
      }

      const tarea = tareaInfo[0];
      if (!(await puedeAbrirTarea(usuario, tarea))) {
        throw new ForbiddenError('Completa primero el ejercicio original para desbloquear este sabotaje');
      }
      // Las misiones y los retos se corrigen simulando sus escenarios; el resto, con tests o salida
      const mision = esSimulacion(tarea) ? await corregirMision(tarea, codigo) : null;
      const { correcto, ejecucion, tests } = mision
        ? { correcto: mision.correcto, ejecucion: comoEjecucion(mision), tests: null }
        : await corregirTarea(tarea, codigo);

      // Registrar el intento (si falla el registro, la corrección no se ve afectada)
      try {
        await query(
          `INSERT INTO intentos (usuario_id, tarea_id, codigo, correcto, tests_superados, tests_totales, tipo_error, segundos_en_tarea)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [usuario.id, tarea.id, codigo, correcto, mision?.superados ?? tests?.superados ?? null,
           mision?.total ?? tests?.total ?? null,
           mision ? tipoErrorMision(mision) : clasificarError(ejecucion, correcto, !!tests),
           Math.max(0, Math.floor(tiempoCompletado || 0))]
        );
      } catch (error) {
        console.error('No se pudo registrar el intento:', error);
      }

      let mensajeFallo = 'Tu código ha dado un error. Revisa la salida de errores.';
      if (mision) {
        mensajeFallo = `Misión superada en ${mision.superados} de ${mision.total} escenarios. ¡Revisa los que fallan!`;
      } else if (tests && ejecucion.status.id === 3) {
        mensajeFallo = `Has superado ${tests.superados} de ${tests.total} tests. ¡Revisa los que fallan!`;
      } else if (ejecucion.status.id === 3) {
        mensajeFallo = 'La salida no coincide con el resultado esperado. ¡Revisa tu código!';
      }

      const respuesta = {
        correcto,
        ejecucion,
        tests,
        yaCompletada: false,
        puntos: 0,
        tiempo: null as string | null,
        mensaje: correcto ? '' : mensajeFallo,
        revelacion: null as any,
        insigniasNuevas: [] as string[],
        mision: mision ? misionParaGraphQL(mision) : null,
      };

      if (!correcto) {
        return respuesta;
      }

      // Sabotaje resuelto: se revela qué había cambiado el saboteador
      const sabotaje = tarea.tipo === 'sabotaje' ? await sabotajePorTarea(tarea.id) : null;
      if (sabotaje) {
        respuesta.revelacion = {
          operador: sabotaje.operador,
          descripcion: sabotaje.descripcion,
          linea: sabotaje.linea,
          diff: sabotaje.diff,
        };
      }

      const puntosBase = tarea.puntos_base || tarea.puntos_nivel;
      // En las misiones, cada estrella por encima de la primera suma un 25 % extra
      const puntosBonus = (tarea.puntos_bonus || 0) + (mision ? Math.round((puntosBase * (mision.estrellas - 1)) / 4) : 0);
      const puntosTotales = puntosBase + puntosBonus;

      // Convertir tiempo a formato TIME (HH:MM:SS)
      const segundosTotales = Math.max(0, Math.floor(tiempoCompletado || 0));
      const horas = Math.floor(segundosTotales / 3600);
      const minutos = Math.floor((segundosTotales % 3600) / 60);
      const segundos = segundosTotales % 60;
      const tiempoFormateado = [horas, minutos, segundos].map((n) => n.toString().padStart(2, '0')).join(':');

      // Insertar el registro y sumar puntos en la misma transacción.
      // La clave primaria (usuario_id, tarea_id) impide sumar dos veces la misma tarea.
      try {
        await transaction(async (conn) => {
          await conn.query(
            `INSERT INTO tareas_usuarios (usuario_id, tarea_id, tiempo_completado, puntos_base, puntos_bonus, puntos_totales)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuario.id, tareaId, tiempoFormateado, puntosBase, puntosBonus, puntosTotales]
          );
          await conn.query('UPDATE usuarios SET puntos = puntos + $1 WHERE id = $2', [puntosTotales, usuario.id]);
        });
      } catch (error: any) {
        if (esDuplicado(error)) {
          return {
            ...respuesta,
            yaCompletada: true,
            mensaje: '¡Correcto! Ya habías completado esta tarea, así que no suma puntos de nuevo.',
          };
        }
        console.error('Error al guardar la tarea completada:', error);
        throw new Error('Error interno del servidor');
      }

      // Insignia «Cirujano»: arreglar el sabotaje cambiando como mucho las líneas que cambió el saboteador
      if (sabotaje && esArregloQuirurgico(tarea.codigo_base, codigo, sabotaje.lineas_cambiadas)) {
        try {
          const nuevas = await ejecutar(
            `INSERT INTO insignias_usuarios (usuario_id, insignia_id)
             SELECT $1, id FROM insignias WHERE nombre = 'Cirujano'
             ON CONFLICT DO NOTHING`,
            [usuario.id]
          );
          if (nuevas > 0) respuesta.insigniasNuevas.push('Cirujano');
        } catch (error) {
          console.error('No se pudo dar la insignia Cirujano:', error);
        }
      }

      return {
        ...respuesta,
        puntos: puntosTotales,
        tiempo: tiempoFormateado,
        mensaje: `¡Felicidades! Has completado la tarea "${tarea.titulo}" y ganado ${puntosTotales} puntos.`,
      };
    },
  },
};
