import { query, ejecutar } from '../../config/db';
import { GraphQLError } from 'graphql';
import { UserInputError, Context, requireAdmin } from '../errors';

interface CrearNivelInput {
  nombre: string;
  puntos: number;
  descripcion?: string;
}

interface ActualizarNivelInput {
  nombre?: string;
  puntos?: number;
  descripcion?: string;
}

export const nivelResolvers = {
  Query: {
    // Obtener todos los niveles
    niveles: async () => {
      try {
        const result = await query('SELECT id, nombre, puntos, descripcion FROM niveles ORDER BY puntos ASC') as any[];
        return result;
      } catch (error) {
        console.error('Error al obtener niveles:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener un nivel por ID
    nivel: async (_: any, { id }: { id: string }) => {
      try {
        const result = await query('SELECT id, nombre, puntos, descripcion FROM niveles WHERE id = $1', [id]) as any[];
        
        if (result.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }
        
        return result[0];
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        console.error('Error al obtener nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener niveles por puntos
    // El schema la define sin argumentos: todos los niveles ordenados por puntos
    nivelesPorPuntos: async () => {
      try {
        const result = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles ORDER BY puntos ASC'
        ) as any[];
        return result;
      } catch (error) {
        console.error('Error al obtener niveles por puntos:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Buscar niveles por nombre
    nivelesPorNombre: async (_: any, { nombre }: { nombre: string }) => {
      try {
        const result = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE nombre ILIKE $1 ORDER BY puntos ASC',
          [`%${nombre}%`]
        ) as any[];
        return result;
      } catch (error) {
        console.error('Error al buscar niveles por nombre:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },

  Mutation: {
    // Crear un nuevo nivel
    crearNivel: async (
      _: any,
      { input }: { input: CrearNivelInput },
      context: Context
    ) => {
      // Verificar autenticación
      requireAdmin(context);

      const { nombre, puntos, descripcion } = input;

      // Validar que el nombre no esté vacío
      if (!nombre || nombre.trim().length === 0) {
        throw new UserInputError('El nombre del nivel es requerido');
      }

      // Validar puntos
      if (puntos < 0) {
        throw new UserInputError('Los puntos deben ser un número positivo');
      }

      try {
        // Verificar que no exista un nivel con el mismo nombre
        const existingLevel = await query(
          'SELECT id FROM niveles WHERE lower(nombre) = lower($1)',
          [nombre.trim()]
        ) as any[];

        if (existingLevel.length > 0) {
          throw new UserInputError('Ya existe un nivel con ese nombre');
        }

        // Verificar que no exista un nivel con los mismos puntos
        const existingPoints = await query(
          'SELECT id FROM niveles WHERE puntos = $1',
          [puntos]
        ) as any[];

        if (existingPoints.length > 0) {
          throw new UserInputError('Ya existe un nivel con esa cantidad de puntos');
        }

        // Crear el nuevo nivel y devolverlo
        const newLevel = await query(
          'INSERT INTO niveles (nombre, puntos, descripcion) VALUES ($1, $2, $3) RETURNING id, nombre, puntos, descripcion',
          [nombre.trim(), puntos, descripcion || null]
        ) as any[];

        return newLevel[0];
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        console.error('Error al crear nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Actualizar un nivel existente
    actualizarNivel: async (
      _: any,
      { id, input }: { id: string; input: ActualizarNivelInput },
      context: Context
    ) => {
      // Verificar autenticación
      requireAdmin(context);

      const { nombre, puntos, descripcion } = input;

      // Validar que se proporcione al menos un campo para actualizar
      if (!nombre && puntos === undefined && descripcion === undefined) {
        throw new UserInputError('Debes proporcionar al menos un campo para actualizar');
      }

      // Validar nombre si se proporciona
      if (nombre && nombre.trim().length === 0) {
        throw new UserInputError('El nombre del nivel no puede estar vacío');
      }

      // Validar puntos si se proporcionan
      if (puntos !== undefined && puntos < 0) {
        throw new UserInputError('Los puntos deben ser un número positivo');
      }

      try {
        // Verificar que el nivel existe
        const levelExists = await query(
          'SELECT id FROM niveles WHERE id = $1',
          [id]
        ) as any[];

        if (levelExists.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }

        // Verificar que no exista otro nivel con el mismo nombre (si se está actualizando el nombre)
        if (nombre) {
          const existingLevel = await query(
            'SELECT id FROM niveles WHERE lower(nombre) = lower($1) AND id != $2',
            [nombre.trim(), id]
          ) as any[];

          if (existingLevel.length > 0) {
            throw new UserInputError('Ya existe otro nivel con ese nombre');
          }
        }

        // Verificar que no exista otro nivel con los mismos puntos (si se están actualizando los puntos)
        if (puntos !== undefined) {
          const existingPoints = await query(
            'SELECT id FROM niveles WHERE puntos = $1 AND id != $2',
            [puntos, id]
          ) as any[];

          if (existingPoints.length > 0) {
            throw new UserInputError('Ya existe otro nivel con esa cantidad de puntos');
          }
        }

        // Construir la consulta de actualización dinámicamente
        const campos: string[] = [];
        const valores: any[] = [];

        if (nombre) {
          valores.push(nombre.trim());
          campos.push(`nombre = $${valores.length}`);
        }

        if (puntos !== undefined) {
          valores.push(puntos);
          campos.push(`puntos = $${valores.length}`);
        }

        if (descripcion !== undefined) {
          valores.push(descripcion);
          campos.push(`descripcion = $${valores.length}`);
        }

        valores.push(id);
        const updateQuery = `UPDATE niveles SET ${campos.join(', ')} WHERE id = $${valores.length}`;

        await query(updateQuery, valores);

        // Obtener el nivel actualizado
        const updatedLevel = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE id = $1',
          [id]
        ) as any[];

        return updatedLevel[0];
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        console.error('Error al actualizar nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Eliminar un nivel
    eliminarNivel: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      // Verificar autenticación
      requireAdmin(context);

      try {
        // Verificar que el nivel existe
        const levelExists = await query(
          'SELECT id FROM niveles WHERE id = $1',
          [id]
        ) as any[];

        if (levelExists.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }

        // Verificar si hay tareas asociadas a este nivel
        const associatedTasks = await query(
          'SELECT id FROM tareas WHERE nivel_id = $1 LIMIT 1',
          [id]
        ) as any[];

        if (associatedTasks.length > 0) {
          throw new UserInputError('No se puede eliminar el nivel porque tiene tareas asociadas');
        }

        // Eliminar el nivel
        return (await ejecutar('DELETE FROM niveles WHERE id = $1', [id])) > 0;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        console.error('Error al eliminar nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },
};