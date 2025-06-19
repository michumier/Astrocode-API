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

interface CrearCategoriaInput {
  nombre: string;
  descripcion?: string;
}

interface ActualizarCategoriaInput {
  nombre?: string;
  descripcion?: string;
}

export const categoriaResolvers = {
  Query: {
    // Obtener todas las categorías
    categorias: async () => {
      try {
        const result = await query('SELECT id, nombre, descripcion FROM categorias ORDER BY nombre') as any[];
        return result;
      } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Obtener una categoría por ID
    categoria: async (_: any, { id }: { id: string }) => {
      try {
        const result = await query('SELECT id, nombre, descripcion FROM categorias WHERE id = ?', [id]) as any[];
        
        if (result.length === 0) {
          throw new UserInputError('Categoría no encontrada');
        }
        
        return result[0];
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Error al obtener categoría:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Buscar categorías por nombre
    categoriasPorNombre: async (_: any, { nombre }: { nombre: string }) => {
      try {
        const result = await query(
          'SELECT id, nombre, descripcion FROM categorias WHERE nombre LIKE ? ORDER BY nombre',
          [`%${nombre}%`]
        ) as any[];
        return result;
      } catch (error) {
        console.error('Error al buscar categorías por nombre:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },

  Mutation: {
    // Crear una nueva categoría
    crearCategoria: async (
      _: any,
      { input }: { input: CrearCategoriaInput },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para crear categorías');
      }

      const { nombre, descripcion } = input;

      // Validar que el nombre no esté vacío
      if (!nombre || nombre.trim().length === 0) {
        throw new UserInputError('El nombre de la categoría es requerido');
      }

      try {
        // Verificar que no exista una categoría con el mismo nombre
        const existingCategory = await query(
          'SELECT id FROM categorias WHERE nombre = ?',
          [nombre.trim()]
        ) as any[];

        if (existingCategory.length > 0) {
          throw new UserInputError('Ya existe una categoría con ese nombre');
        }

        // Crear la nueva categoría
        const result = await query(
          'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
          [nombre.trim(), descripcion || null]
        ) as any;

        // Obtener la categoría creada
        const newCategory = await query(
          'SELECT id, nombre, descripcion FROM categorias WHERE id = ?',
          [result.insertId]
        ) as any[];

        return newCategory[0];
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Error al crear categoría:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Actualizar una categoría existente
    actualizarCategoria: async (
      _: any,
      { id, input }: { id: string; input: ActualizarCategoriaInput },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para actualizar categorías');
      }

      const { nombre, descripcion } = input;

      // Validar que se proporcione al menos un campo para actualizar
      if (!nombre && descripcion === undefined) {
        throw new UserInputError('Debes proporcionar al menos un campo para actualizar');
      }

      // Validar nombre si se proporciona
      if (nombre && nombre.trim().length === 0) {
        throw new UserInputError('El nombre de la categoría no puede estar vacío');
      }

      try {
        // Verificar que la categoría existe
        const categoryExists = await query(
          'SELECT id FROM categorias WHERE id = ?',
          [id]
        ) as any[];

        if (categoryExists.length === 0) {
          throw new UserInputError('Categoría no encontrada');
        }

        // Verificar que no exista otra categoría con el mismo nombre (si se está actualizando el nombre)
        if (nombre) {
          const existingCategory = await query(
            'SELECT id FROM categorias WHERE nombre = ? AND id != ?',
            [nombre.trim(), id]
          ) as any[];

          if (existingCategory.length > 0) {
            throw new UserInputError('Ya existe otra categoría con ese nombre');
          }
        }

        // Construir la consulta de actualización dinámicamente
        const campos: string[] = [];
        const valores: any[] = [];

        if (nombre) {
          campos.push('nombre = ?');
          valores.push(nombre.trim());
        }

        if (descripcion !== undefined) {
          campos.push('descripcion = ?');
          valores.push(descripcion);
        }

        valores.push(id);
        const updateQuery = `UPDATE categorias SET ${campos.join(', ')} WHERE id = ?`;

        await query(updateQuery, valores);

        // Obtener la categoría actualizada
        const updatedCategory = await query(
          'SELECT id, nombre, descripcion FROM categorias WHERE id = ?',
          [id]
        ) as any[];

        return updatedCategory[0];
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Error al actualizar categoría:', error);
        throw new Error('Error interno del servidor');
      }
    },

    // Eliminar una categoría
    eliminarCategoria: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      // Verificar autenticación
      if (!context.user) {
        throw new ForbiddenError('Debes estar autenticado para eliminar categorías');
      }

      try {
        // Verificar que la categoría existe
        const categoryExists = await query(
          'SELECT id FROM categorias WHERE id = ?',
          [id]
        ) as any[];

        if (categoryExists.length === 0) {
          throw new UserInputError('Categoría no encontrada');
        }

        // Verificar si hay tareas asociadas a esta categoría
        const associatedTasks = await query(
          'SELECT id FROM tareas WHERE categoria_id = ? LIMIT 1',
          [id]
        ) as any[];

        if (associatedTasks.length > 0) {
          throw new UserInputError('No se puede eliminar la categoría porque tiene tareas asociadas');
        }

        // Eliminar la categoría
        const result = await query(
          'DELETE FROM categorias WHERE id = ?',
          [id]
        ) as any;

        return result.affectedRows > 0;
      } catch (error) {
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Error al eliminar categoría:', error);
        throw new Error('Error interno del servidor');
      }
    },
  },
};