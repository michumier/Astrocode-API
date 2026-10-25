import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import fetch from 'cross-fetch';

const serverUrl = 'http://localhost:4000/graphql'; // Cambia al endpoint real

const generateUniqueUser = () => {
  const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
  return {
    nombre_usuario: `testuser_${uniqueId}`,
    correo_electronico: `testuser_${uniqueId}@example.com`,
    contrasena: 'password123'
  };
};

describe('Pruebas de Integración - Reto Diario', () => {
  let client: ApolloClient<any>;
  let authenticatedClient: ApolloClient<any>;
  let userToken: string;
  let testUser: { nombre_usuario: string; correo_electronico: string; contrasena: string };

  beforeAll(() => {
    const httpLink = createHttpLink({ uri: serverUrl, fetch });
    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  beforeEach(async () => {
    testUser = generateUniqueUser();
    // Registro usuario
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
        }
      }
    `;
    await client.mutate({
      mutation: REGISTER_MUTATION,
      variables: { input: testUser }
    });
    const loginResponse = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { input: {
        nombre_usuario: testUser.nombre_usuario,
        correo_electronico: testUser.correo_electronico,
        contrasena: testUser.contrasena
      } }
    });
    userToken = loginResponse.data.login.token;
    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: userToken ? `Bearer ${userToken}` : "",
      },
    }));
    authenticatedClient = new ApolloClient({
      link: authLink.concat(createHttpLink({ uri: serverUrl, fetch })),
      cache: new InMemoryCache(),
    });
  });

  const DAILY_CHALLENGE_QUERY = gql`
    query RetoDiarioActual {
      retoDiarioActual {
        id
        titulo
        descripcion
        fechaInicio
        fechaFin
        puntosRecompensa
        completado
      }
    }
  `;

  test('Devuelve reto diario si existe', async () => {
    // Aquí deberías asegurarte que el reto está insertado en la BD manualmente o mediante otro script

    const response = await authenticatedClient.query({
      query: DAILY_CHALLENGE_QUERY,
      fetchPolicy: 'network-only',
    });

    expect(response.data.retoDiarioActual).toBeDefined();
  });
});
