import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db';
import { GraphQLError } from 'graphql';

// Custom error classes for Apollo Server v4
class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
}

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

interface Usuario {
  id: string;
  nombre_usuario: string;
  correo_electronico: string;
  nombre_completo?: string;
  puntos: number;
  creado_el: string;
}

interface CrearUsuarioInput {
  nombre_usuario: string;
  correo_electronico: string;
  contrasena: string;
  nombre_completo?: string;
}

interface ActualizarUsuarioInput {
  nombre_usuario?: string;
  correo_electronico?: string;
  nombre_completo?: string;
  puntos?: number;
}

interface LoginInput {
  correo_electronico: string;
  contrasena: string;
}

interface Context {
  token?: string;
  user?: Usuario;
}

// Función para generar JWT
const generateToken = (usuario: Usuario): string => {
  return jwt.sign(
    { 
      id: usuario.id, 
      correo_electronico: usuario.correo_electronico 
    },
    process.env.JWT_SECRET || 'tu-secreto-jwt',
    { expiresIn: '7d' }
  );
};

// Función para verificar JWT
const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'tu-secreto-jwt');
  } catch (error) {
    throw new AuthenticationError('Token inválido');
  }
};

// Función helper para formatear fechas de usuario
const formatUsuarioFechas = (usuario: any) => {
  if (usuario.creado_el) {
    usuario.creado_el = new Date(usuario.creado_el).toISOString();
  }
  return usuario;
};

// Función para obtener usuario del contexto
export const getUsuarioFromToken = async (token: string): Promise<Usuario> => {
  if (!token) {
    throw new AuthenticationError('Token requerido');
  }
  
  const decoded = verifyToken(token);
  const usuarios = await query(
    'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE id = ?',
    [decoded.id]
  ) as Usuario[];
  
  if (!usuarios.length) {
    throw new AuthenticationError('Usuario no encontrado');
  }
  
  return formatUsuarioFechas(usuarios[0]);
};

export const userResolvers = {
  Query: {
    // Obtener todos los usuarios
    usuarios: async (): Promise<Usuario[]> => {
      try {
        // console.log('Intentando conectar a la base de datos...');
        // Verificar conexión y base de datos
        // const dbCheck = await query('SELECT DATABASE() as current_db') as any[];
        // console.log('Base de datos actual:', dbCheck[0].current_db);
        // const tablesCheck = await query(
        //   "SHOW TABLES FROM astrocodebd"
        // ) as any[];
        // console.log('Tablas disponibles:', tablesCheck.map(t => Object.values(t)[0]));
        // const tableCheck = await query(
        //   "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'astrocodebd' AND table_name = 'usuarios'"
        // ) as any[];
        // console.log('Verificación de tabla usuarios:', tableCheck[0].count);
        // if (tableCheck[0].count === 0) {
        //   throw new Error('La tabla usuarios no se encuentra en la base de datos astrocodebd.');
        // }
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios ORDER BY creado_el DESC'
        ) as Usuario[];
        // console.log('Usuarios obtenidos:', usuarios.length);
        return usuarios.map(formatUsuarioFechas);
      } catch (error) {
        console.error('Error detallado al obtener usuarios:', error);
        throw new Error(`Error al obtener usuarios: ${(error as Error).message}`);
      }
    },

    // Obtener un usuario por ID
    usuario: async (_: any, { id }: { id: string }): Promise<Usuario | null> => {
      try {
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE id = ?',
          [id]
        ) as Usuario[];
        return usuarios.length ? usuarios[0] : null;
      } catch (error) {
        throw new Error('Error al obtener usuario');
      }
    },

    // Obtener usuario por email
    usuarioPorEmail: async (_: any, { correo_electronico }: { correo_electronico: string }): Promise<Usuario | null> => {
      try {
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE correo_electronico = ?',
          [correo_electronico]
        ) as Usuario[];
        return usuarios.length ? usuarios[0] : null;
      } catch (error) {
        throw new Error('Error al obtener usuario por email');
      }
    },

    // Obtener el usuario actual (autenticado)
        me: async (_: any, __: any, context: Context): Promise<Usuario> => {
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para realizar esta acción');
      }
      return context.user;
    },
    // Obtener estadísticas del usuario autenticado
    getUserStats: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para ver tus estadísticas');
      }
      // Obtener puntos del usuario
      const usuarios = await query(
        'SELECT puntos FROM usuarios WHERE id = ?',
        [context.user.id]
      ) as { puntos: number }[];
      const puntos = usuarios.length ? usuarios[0].puntos : 0;
      
      // Obtener tareas completadas directamente de la base de datos
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
        
        const tareasCompletadas = result.map(tarea => ({
          ...tarea,
          puntosBase: tarea.puntos_base,
          puntosBonus: tarea.puntos_bonus,
          codigoBase: tarea.codigo_base,
          resultadoEsperado: tarea.resultado_esperado,
          nivel: {
            nombre: tarea.nivel_nombre
          }
        }));
        
        return {
          puntos,
          tareasCompletadas
        };
      } catch (error) {
        console.error('Error al obtener tareas completadas para estadísticas:', error);
        // En caso de error, devolver un array vacío de tareas completadas
        return {
          puntos,
          tareasCompletadas: []
        };
      }
    },
  },

  Mutation: {
    // Crear un nuevo usuario
    crearUsuario: async (_: any, { input }: { input: CrearUsuarioInput }): Promise<Usuario> => {
      try {
        // Verificar si el usuario ya existe
        const usuarioExistente = await query(
          'SELECT id FROM usuarios WHERE correo_electronico = ? OR nombre_usuario = ?',
          [input.correo_electronico, input.nombre_usuario]
        ) as any[];

        if (usuarioExistente.length > 0) {
          throw new UserInputError('El usuario o email ya existe');
        }

        // Hash de la contraseña
        const contrasenaHash = await bcrypt.hash(input.contrasena, 12);

        // Insertar nuevo usuario
        const resultado = await query(
          `INSERT INTO usuarios (nombre_usuario, correo_electronico, contrasena_hash, nombre_completo, puntos) 
           VALUES (?, ?, ?, ?, 0)`,
          [input.nombre_usuario, input.correo_electronico, contrasenaHash, input.nombre_completo || null]
        ) as any;

        // Obtener el usuario creado
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE id = ?',
          [resultado.insertId]
        ) as Usuario[];

        return usuarios[0];
      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Error al crear usuario');
      }
    },

    // Actualizar un usuario existente
    actualizarUsuario: async (_: any, { id, input }: { id: string; input: ActualizarUsuarioInput }, context: Context): Promise<Usuario> => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Debes estar autenticado para realizar esta acción');
        }
        const usuarioActual = context.user;
        
        // Solo el propio usuario puede actualizarse (o implementar roles de admin)
        if (usuarioActual.id.toString() !== id.toString()) {
          throw new ForbiddenError('No tienes permisos para actualizar este usuario');
        }

        // Verificar que el usuario a actualizar existe
        const usuarioExistente = await query(
          'SELECT id FROM usuarios WHERE id = ?',
          [id]
        ) as any[];

        if (usuarioExistente.length === 0) {
          throw new UserInputError('Usuario no encontrado');
        }

        // Verificar si el nuevo nombre de usuario o email ya existen (si se están actualizando)
        if (input.nombre_usuario || input.correo_electronico) {
          const condiciones: string[] = [];
          const parametros: any[] = [];
          
          if (input.nombre_usuario) {
            condiciones.push('nombre_usuario = ?');
            parametros.push(input.nombre_usuario);
          }
          if (input.correo_electronico) {
            condiciones.push('correo_electronico = ?');
            parametros.push(input.correo_electronico);
          }
          
          parametros.push(id);
          
          const conflictos = await query(
            `SELECT id FROM usuarios WHERE (${condiciones.join(' OR ')}) AND id != ?`,
            parametros
          ) as any[];

          if (conflictos.length > 0) {
            throw new UserInputError('El nombre de usuario o email ya están en uso');
          }
        }

        // Construir query dinámicamente
        const campos: string[] = [];
        const valores: any[] = [];
        
        if (input.nombre_usuario) {
          campos.push('nombre_usuario = ?');
          valores.push(input.nombre_usuario);
        }
        if (input.correo_electronico) {
          campos.push('correo_electronico = ?');
          valores.push(input.correo_electronico);
        }
        if (input.nombre_completo !== undefined) {
          campos.push('nombre_completo = ?');
          valores.push(input.nombre_completo);
        }
        if (input.puntos !== undefined) {
          campos.push('puntos = ?');
          valores.push(input.puntos);
        }

        if (campos.length === 0) {
          throw new UserInputError('No hay campos para actualizar');
        }

        valores.push(id);

        const resultado = await query(
          `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
          valores
        ) as any;

        if (resultado.affectedRows === 0) {
          throw new Error('No se pudo actualizar el usuario');
        }

        // Obtener el usuario actualizado
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, nombre_completo, puntos, creado_el FROM usuarios WHERE id = ?',
          [id]
        ) as Usuario[];

        if (usuarios.length === 0) {
          throw new Error('Error al obtener el usuario actualizado');
        }

        return usuarios[0];
      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Error en actualizarUsuario:', error);
        throw new Error('Error al actualizar usuario');
      }
    },

    // Eliminar un usuario
    eliminarUsuario: async (_: any, { id }: { id: string }, context: Context): Promise<boolean> => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Debes estar autenticado para realizar esta acción');
        }
        const usuarioActual = context.user;
        
        // Solo el propio usuario puede eliminarse (o implementar roles de admin)
        if (usuarioActual.id !== id) {
          throw new ForbiddenError('No tienes permisos para eliminar este usuario');
        }

        const resultado = await query(
          'DELETE FROM usuarios WHERE id = ?',
          [id]
        ) as any;

        return resultado.affectedRows > 0;
      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Error al eliminar usuario');
      }
    },

    // Login de usuario
    login: async (_: any, { input }: { input: LoginInput }): Promise<{ token: string; usuario: Usuario }> => {
      try {
        // Buscar usuario por email
        const usuarios = await query(
          'SELECT id, nombre_usuario, correo_electronico, contrasena_hash, nombre_completo, puntos, creado_el FROM usuarios WHERE correo_electronico = ?',
          [input.correo_electronico]
        ) as any[];

        if (!usuarios.length) {
          throw new AuthenticationError('Credenciales inválidas');
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(input.contrasena, usuario.contrasena_hash);
        if (!contrasenaValida) {
          throw new AuthenticationError('Credenciales inválidas');
        }

        // Generar token
        const token = generateToken(usuario);

        // Remover hash de contraseña del objeto usuario
        const { contrasena_hash, ...usuarioSinHash } = usuario;

        return {
          token,
          usuario: formatUsuarioFechas(usuarioSinHash)
        };
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('Error en el login');
      }
    },

    // Cambiar contraseña
    cambiarContrasena: async (
      _: any, 
      { id, contrasenaActual, nuevaContrasena }: { id: string; contrasenaActual: string; nuevaContrasena: string }, 
      context: Context
    ): Promise<boolean> => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Debes estar autenticado para realizar esta acción');
        }
        const usuarioActual = context.user;
        
        // Solo el propio usuario puede cambiar su contraseña
        if (usuarioActual.id !== id) {
          throw new ForbiddenError('No tienes permisos para cambiar esta contraseña');
        }

        // Obtener hash actual
        const usuarios = await query(
          'SELECT contrasena_hash FROM usuarios WHERE id = ?',
          [id]
        ) as any[];

        if (!usuarios.length) {
          throw new Error('Usuario no encontrado');
        }

        // Verificar contraseña actual
        const contrasenaValida = await bcrypt.compare(contrasenaActual, usuarios[0].contrasena_hash);
        if (!contrasenaValida) {
          throw new AuthenticationError('Contraseña actual incorrecta');
        }

        // Hash de la nueva contraseña
        const nuevoHash = await bcrypt.hash(nuevaContrasena, 12);

        // Actualizar contraseña
        const resultado = await query(
          'UPDATE usuarios SET contrasena_hash = ? WHERE id = ?',
          [nuevoHash, id]
        ) as any;

        return resultado.affectedRows > 0;
      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('Error al cambiar contraseña');
      }
    },
    // Registrar click en recurso externo
    registrarClickRecurso: async (_: any, { recursoId }: { recursoId: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Debes estar autenticado para registrar el click');
      }
      // Aquí podrías registrar el click en la base de datos si lo deseas
      // await query('INSERT INTO clicks_recursos (usuario_id, recurso_id, fecha) VALUES (?, ?, NOW())', [context.user.id, recursoId]);
      return {
        exito: true,
        mensaje: `Click registrado para recurso ${recursoId}`
      };
    },
  },
};