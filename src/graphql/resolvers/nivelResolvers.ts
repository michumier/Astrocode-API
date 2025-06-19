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

// Context interface
interface Context {
  token?: string;
  user?: any;
}

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
        const result = await query('SELECT id, nombre, puntos, descripcion FROM niveles WHERE id = ?', [id]) as any[];
        
        if (result.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }
        
        return result[0];
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Error al obtener nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener niveles por puntos
    nivelesPorPuntos: async (_: any, { puntos }: { puntos: number }) => {
      try {
        const result = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE puntos = ? ORDER BY nombre',
          [puntos]
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
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE nombre LIKE ? ORDER BY puntos ASC',
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
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para crear niveles');
      }

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
          'SELECT id FROM niveles WHERE nombre = ?',
          [nombre.trim()]
        ) as any[];

        if (existingLevel.length > 0) {
          throw new UserInputError('Ya existe un nivel con ese nombre');
        }

        // Verificar que no exista un nivel con los mismos puntos
        const existingPoints = await query(
          'SELECT id FROM niveles WHERE puntos = ?',
          [puntos]
        ) as any[];

        if (existingPoints.length > 0) {
          throw new UserInputError('Ya existe un nivel con esa cantidad de puntos');
        }

        // Crear el nuevo nivel
        const result = await query(
          'INSERT INTO niveles (nombre, puntos, descripcion) VALUES (?, ?, ?)',
          [nombre.trim(), puntos, descripcion || null]
        ) as any;

        // Obtener el nivel creado
        const newLevel = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE id = ?',
          [result.insertId]
        ) as any[];

        return newLevel[0];
      } catch (error) {
        if (error instanceof UserInputError) {
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
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para actualizar niveles');
      }

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
          'SELECT id FROM niveles WHERE id = ?',
          [id]
        ) as any[];

        if (levelExists.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }

        // Verificar que no exista otro nivel con el mismo nombre (si se está actualizando el nombre)
        if (nombre) {
          const existingLevel = await query(
            'SELECT id FROM niveles WHERE nombre = ? AND id != ?',
            [nombre.trim(), id]
          ) as any[];

          if (existingLevel.length > 0) {
            throw new UserInputError('Ya existe otro nivel con ese nombre');
          }
        }

        // Verificar que no exista otro nivel con los mismos puntos (si se están actualizando los puntos)
        if (puntos !== undefined) {
          const existingPoints = await query(
            'SELECT id FROM niveles WHERE puntos = ? AND id != ?',
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
          campos.push('nombre = ?');
          valores.push(nombre.trim());
        }

        if (puntos !== undefined) {
          campos.push('puntos = ?');
          valores.push(puntos);
        }

        if (descripcion !== undefined) {
          campos.push('descripcion = ?');
          valores.push(descripcion);
        }

        valores.push(id);
        const updateQuery = `UPDATE niveles SET ${campos.join(', ')} WHERE id = ?`;

        await query(updateQuery, valores);

        // Obtener el nivel actualizado
        const updatedLevel = await query(
          'SELECT id, nombre, puntos, descripcion FROM niveles WHERE id = ?',
          [id]
        ) as any[];

        return updatedLevel[0];
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
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
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para eliminar niveles');
      }

      try {
        // Verificar que el nivel existe
        const levelExists = await query(
          'SELECT id FROM niveles WHERE id = ?',
          [id]
        ) as any[];

        if (levelExists.length === 0) {
          throw new UserInputError('Nivel no encontrado');
        }

        // Verificar si hay tareas asociadas a este nivel
        const associatedTasks = await query(
          'SELECT id FROM tareas WHERE nivel_id = ? LIMIT 1',
          [id]
        ) as any[];

        if (associatedTasks.length > 0) {
          throw new UserInputError('No se puede eliminar el nivel porque tiene tareas asociadas');
        }

        // Verificar si hay usuarios asociados a este nivel
        const associatedUsers = await query(
          'SELECT id FROM usuarios WHERE nivel_id = ? LIMIT 1',
          [id]
        ) as any[];

        if (associatedUsers.length > 0) {
          throw new UserInputError('No se puede eliminar el nivel porque tiene usuarios asociados');
        }

        // Eliminar el nivel
        const result = await query(
          'DELETE FROM niveles WHERE id = ?',
          [id]
        ) as any;

        return result.affectedRows > 0;
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Error al eliminar nivel:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },
};