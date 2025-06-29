import { gql } from 'apollo-server-express';

export const tareaTypeDefs = gql`
  type Tarea {
    id: ID!
    categoria: Categoria!
    nivel: Nivel!
    titulo: String!
    descripcion: String!
    fechaVencimiento: String
    prioridad: Int
    completado: Boolean!
    tiempoFinalizacionId: ID
    puntosBase: Int
    puntosBonus: Int!
    codigoBase: String
    resultadoEsperado: String
  }

  input CrearTareaInput {
    categoriaId: ID!
    nivelId: ID!
    titulo: String!
    descripcion: String!
    fechaVencimiento: String
    prioridad: Int
    puntosBase: Int
    tiempoFinalizacionId: ID
    codigoBase: String
    resultadoEsperado: String
  }

  input ActualizarTareaInput {
    categoriaId: ID
    nivelId: ID
    titulo: String
    descripcion: String
    fechaVencimiento: String
    prioridad: Int
    completado: Boolean
    puntosBase: Int
    tiempoFinalizacionId: ID
    codigoBase: String
    resultadoEsperado: String
  }

  input FiltroTareasInput {
    categoriaId: ID
    nivelId: ID
    completado: Boolean
    prioridad: Int
  }

  extend type Query {
    # Obtener todas las tareas
    tareas(filtro: FiltroTareasInput): [Tarea!]!
    
    # Obtener una tarea por ID
    tarea(id: ID!): Tarea
    
    # Obtener tareas por categoría
    tareasPorCategoria(categoriaId: ID!): [Tarea!]!
    
    # Obtener tareas por nivel
    tareasPorNivel(nivelId: ID!): [Tarea!]!
    
    # Obtener tareas por prioridad
    tareasPorPrioridad(prioridad: Int!): [Tarea!]!
    
    # Obtener tareas completadas
    tareasCompletadas: [Tarea!]!
    
    # Obtener tareas pendientes
    tareasPendientes: [Tarea!]!
    
    # Verificar si una tarea está completada por el usuario
    esTareaCompletada(tareaId: ID!): Boolean!
  }

  extend type Mutation {
    # Crear una nueva tarea
    crearTarea(input: CrearTareaInput!): Tarea!
    
    # Actualizar una tarea existente
    actualizarTarea(id: ID!, input: ActualizarTareaInput!): Tarea!
    
    # Marcar tarea como completada
    completarTarea(tareaId: ID!, tiempoCompletado: Int!): CompletarTareaResponse!
    
    # Eliminar una tarea
    eliminarTarea(id: ID!): Boolean!
  }

  type CompletarTareaResponse {
    success: Boolean!
    puntos: Int!
    tiempo: String!
    mensaje: String!
  }
`;