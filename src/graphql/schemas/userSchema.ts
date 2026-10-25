import gql from 'graphql-tag';

export const userTypeDefs = gql`
  type Usuario {
    id: ID!
    nombre_usuario: String!
    correo_electronico: String!
    nombre_completo: String
    puntos: Int
    rol: String
    creado_el: String
  }

  type RankingEntry {
    id: ID!
    nombre_usuario: String!
    puntos: Int!
    posicion: Int!
  }

  input CrearUsuarioInput {
    nombre_usuario: String!
    correo_electronico: String!
    contrasena: String!
    nombre_completo: String
  }

  input ActualizarUsuarioInput {
    nombre_usuario: String
    correo_electronico: String
    nombre_completo: String
  }

  input LoginInput {
    correo_electronico: String!
    contrasena: String!
  }

  type AuthPayload {
    token: String!
    usuario: Usuario!
  }

  type UserStats {
    puntos: Int!
    tareasCompletadas: [Tarea!]!
  }

  extend type Query {
    # Obtener todos los usuarios (solo admin)
    usuarios: [Usuario!]!

    # Ranking público (sin emails)
    ranking(limite: Int): [RankingEntry!]!
    
    # Obtener un usuario por ID
    usuario(id: ID!): Usuario
    
    # Obtener usuario por email
    usuarioPorEmail(correo_electronico: String!): Usuario
    
    # Obtener el usuario actual (autenticado)
    me: Usuario
    
    # Obtener estadísticas del usuario autenticado
    getUserStats: UserStats!
  }

  type RegistrarClickRecursoResponse {
    exito: Boolean!
    mensaje: String!
  }

  extend type Mutation {
    # Crear un nuevo usuario
    crearUsuario(input: CrearUsuarioInput!): Usuario!
    
    # Actualizar un usuario existente
    actualizarUsuario(id: ID!, input: ActualizarUsuarioInput!): Usuario!
    
    # Eliminar un usuario
    eliminarUsuario(id: ID!): Boolean!
    
    # Login de usuario
    login(input: LoginInput!): AuthPayload!
    
    # Cambiar contraseña
    cambiarContrasena(id: ID!, contrasenaActual: String!, nuevaContrasena: String!): Boolean!
    
    # Registrar click en recurso externo
    registrarClickRecurso(recursoId: ID!): RegistrarClickRecursoResponse!
  }
`;