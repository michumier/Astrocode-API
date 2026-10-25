import gql from 'graphql-tag';

export const tareaTypeDefs = gql`
  type Tarea {
    id: ID!
    # codigo | sabotaje | pilotaje
    tipo: String!
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
    # Solución de referencia (nunca se envía al alumno)
    solucion: String
    tests: [TestTareaInput!]
  }

  input TestTareaInput {
    descripcion: String
    # Código que se ejecuta después del del alumno (llamadas a su función + print)
    codigoTest: String
    entrada: String
    salidaEsperada: String!
    oculto: Boolean
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

    # Obtener el reto diario
    dailyChallenge: Tarea

    # Historial de envíos del usuario autenticado en una tarea (más reciente primero)
    misIntentos(tareaId: ID!, limite: Int): [Intento!]!
  }

  extend type Mutation {
    # Crear una nueva tarea
    crearTarea(input: CrearTareaInput!): Tarea!
    
    # Actualizar una tarea existente
    actualizarTarea(id: ID!, input: ActualizarTareaInput!): Tarea!
    
    # Enviar una solución: el servidor ejecuta el código, lo corrige y suma los puntos
    enviarSolucion(tareaId: ID!, codigo: String!, tiempoCompletado: Int!): ResultadoSolucion!
    
    # Eliminar una tarea
    eliminarTarea(id: ID!): Boolean!
  }

  type Intento {
    id: ID!
    codigo: String!
    correcto: Boolean!
    testsSuperados: Int
    testsTotales: Int
    # NameError, IndentationError, Timeout, TestsFallidos, SalidaIncorrecta...
    tipoError: String
    segundosEnTarea: Int
    creadoEl: String!
  }

  type ResultadoTest {
    descripcion: String!
    oculto: Boolean!
    superado: Boolean!
    esperado: String
    obtenido: String
    error: String
  }

  type ResultadoTests {
    superados: Int!
    total: Int!
    resultados: [ResultadoTest!]!
  }

  type ResultadoSolucion {
    correcto: Boolean!
    tests: ResultadoTests
    yaCompletada: Boolean!
    puntos: Int!
    tiempo: String
    mensaje: String!
    ejecucion: ExecutionResult!
  }
`;