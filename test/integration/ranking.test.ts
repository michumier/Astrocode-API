import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

describe.skip('Pruebas de Integración - Consultar Clasificación', () => {
  let client: ApolloClient<any>;
  let authenticatedClient: ApolloClient<any>;
  let userToken: string;

  // Variables propias del test, ajusta la URL del servidor aquí
  const serverUrl = 'http://localhost:4000/graphql';

  beforeAll(async () => {
    // Ya no llamamos a setupTestEnvironment()

    const httpLink = createHttpLink({
      uri: serverUrl,
    });

    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  afterAll(async () => {
    // Ya no llamamos a cleanupTestData() ni teardownTestEnvironment()
  });

  beforeEach(async () => {
    // Ya no limpiamos datos con cleanupTestData()

    const REGISTER_MUTATION = gql`
      mutation CrearUsuario($input: CrearUsuarioInput!) {
        crearUsuario(input: $input) {
          id
        }
      }
    `;

    const LOGIN_MUTATION = gql`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          usuario {
            id
          }
        }
      }
    `;

    // Usuarios de prueba con puntos
    const testUsersForRanking = [
      {
        nombre_usuario: 'user1',
        correo_electronico: 'user1@test.com',
        contrasena: 'password123',
        nombre_completo: 'Usuario Uno',
        puntos: 1000
      },
      {
        nombre_usuario: 'user2',
        correo_electronico: 'user2@test.com',
        contrasena: 'password123',
        nombre_completo: 'Usuario Dos',
        puntos: 800
      },
      {
        nombre_usuario: 'user3',
        correo_electronico: 'user3@test.com',
        contrasena: 'password123',
        nombre_completo: 'Usuario Tres',
        puntos: 600
      },
      {
        nombre_usuario: 'user4',
        correo_electronico: 'user4@test.com',
        contrasena: 'password123',
        nombre_completo: 'Usuario Cuatro',
        puntos: 400
      },
      {
        nombre_usuario: 'user5',
        correo_electronico: 'user5@test.com',
        contrasena: 'password123',
        nombre_completo: 'Usuario Cinco',
        puntos: 200
      }
    ];

    // Crear usuarios con mutación
    for (const user of testUsersForRanking) {
      await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: user }
      });
    }

    // Login con el primer usuario para obtener token
    const loginResponse = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          correo_electronico: testUsersForRanking[0].correo_electronico,
          contrasena: testUsersForRanking[0].contrasena
        }
      }
    });

    userToken = loginResponse.data.login.token;

    // Crear cliente autenticado con token
    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: userToken ? `Bearer ${userToken}` : "",
      }
    }));

    authenticatedClient = new ApolloClient({
      link: authLink.concat(createHttpLink({ uri: serverUrl })),
      cache: new InMemoryCache(),
    });
  });

  const TOP_RANKING_QUERY = gql`
    query TopRanking($limite: Int) {
      topRanking(limite: $limite) {
        id
        nombre_usuario
        nombre_completo
        puntos
        posicion
      }
    }
  `;

  const ALL_USERS_QUERY = gql`
    query Usuarios {
      usuarios {
        id
        nombre_usuario
        nombre_completo
        puntos
      }
    }
  `;

  // El resto de tests sin cambios...
  // ...

});
