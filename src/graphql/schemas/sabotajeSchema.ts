import gql from 'graphql-tag';

export const sabotajeTypeDefs = gql`
  # Sabotaje generado y verificado (vista de admin: incluye el diff)
  type Sabotaje {
    id: ID!
    tareaOriginalId: ID!
    # Tarea jugable creada al publicarlo (null si aún no está publicado)
    tareaId: ID
    operador: String!
    descripcion: String!
    linea: Int
    lineasCambiadas: Int!
    diff: String!
    codigo: String!
    contexto: String
    # facil | media | dificil
    dificultad: String!
    testsFallidos: Int!
    testsTotales: Int!
    # ast | ia
    origen: String!
    creadoEl: String!
  }

  type TareaSaboteable {
    id: ID!
    titulo: String!
    tests: Int!
    sabotajes: Int!
    publicados: Int!
  }

  type SabotajeDisponible {
    tareaId: ID!
    titulo: String!
    contexto: String
    dificultad: String!
    completada: Boolean!
    tareaOriginalTitulo: String!
  }

  type SalaDeMaquinas {
    disponibles: [SabotajeDisponible!]!
    # Sabotajes publicados que el alumno aún no ha desbloqueado
    bloqueados: Int!
  }

  extend type Query {
    # Admin: tareas con solución y tests suficientes para sabotearlas
    tareasSaboteables: [TareaSaboteable!]!
    # Admin: sabotajes generados para una tarea
    sabotajesDeTarea(tareaId: ID!): [Sabotaje!]!
    # Alumno: sabotajes desbloqueados (ha completado la tarea original) y cuántos quedan bloqueados
    salaDeMaquinas: SalaDeMaquinas!
  }

  extend type Mutation {
    # Admin: genera sabotajes nuevos verificados en el sandbox (sin publicar)
    generarSabotajes(tareaId: ID!, cantidad: Int, usarIa: Boolean): [Sabotaje!]!
    # Admin: crea la tarea jugable a partir de un sabotaje
    publicarSabotaje(id: ID!, contexto: String): Tarea!
    # Admin: descarta un sabotaje que no está publicado
    descartarSabotaje(id: ID!): Boolean!
  }
`;
