import gql from 'graphql-tag';

// Ruta de aprendizaje (fase 11, docs/TEMARIO.md)
export const rutaTypeDefs = gql`
  type PasoRuta {
    # Número del paso en el temario (puede saltar: los huecos son lecciones y ejercicios por llegar)
    orden: Int!
    # tarea (y desde la fase 12, leccion)
    tipo: String!
    tarea: Tarea
    # hecho | siguiente | pendiente | bloqueado
    estado: String!
  }

  type PlanetaRuta {
    clave: String!
    nombre: String!
    tema: String!
    orden: Int!
    # Puntos por conquistarlo
    bonus: Int!
    # conquistado | abierto | bloqueado
    estado: String!
    hechos: Int!
    total: Int!
    pasos: [PasoRuta!]!
  }

  type PlanetaConquistado {
    clave: String!
    nombre: String!
    puntos: Int!
  }

  extend type Query {
    # Los planetas en orden con el estado de cada paso para el usuario (sin sesión, como si empezara)
    ruta: [PlanetaRuta!]!
  }
`;
