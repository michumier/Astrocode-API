import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import fetch from 'cross-fetch';

const serverUrl = 'http://localhost:4000/graphql'; // Cambia por tu URL real

const testUser = {
  nombre_usuario: 'testuser',
  correo_electronico: 'testuser@example.com',
  contrasena: 'password123'
};

// Generador de usuario único para evitar conflictos
const generateUniqueUser = () => {
  const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
  return {
    nombre_usuario: `testuser_${uniqueId}`,
    correo_electronico: `testuser_${uniqueId}@example.com`,
    contrasena: 'password123'
  };
};

describe('Pruebas de Integración - Login de Usuario', () => {
  let client: ApolloClient<any>;
  let testUser: {
    nombre_usuario: string;
    correo_electronico: string;
    contrasena: string;
  };

  beforeAll(() => {
    const httpLink = createHttpLink({ uri: serverUrl, fetch });
    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  const REGISTER_MUTATION = gql`
    mutation CrearUsuario($input: CrearUsuarioInput!) {
      crearUsuario(input: $input) {
        id
        correo_electronico
      }
    }
  `;

  const LOGIN_MUTATION = gql`
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        usuario {
          id
          nombre_usuario
          correo_electronico
          nombre_completo
          puntos
        }
      }
    }
  `;

  beforeEach(async () => {
    testUser = generateUniqueUser();
    try {
      await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: testUser }
      });
    } catch (error) {
      if (!((error as Error).message.includes('ya existe'))) {
        throw error;
      }
    }
  });

  test('Login con credenciales válidas', async () => {
    const loginInput = {
      correo_electronico: testUser.correo_electronico,
      contrasena: testUser.contrasena
    };
    const response = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { input: loginInput }
    });
    expect(response.data).toBeDefined();
    expect(response.data.login).toBeDefined();
    expect(response.data.login.token).toBeDefined();
    expect(response.data.login.usuario.correo_electronico).toBe(loginInput.correo_electronico);
  });

  test('Login con contraseña incorrecta debe fallar', async () => {
    const loginInput = {
      correo_electronico: testUser.correo_electronico,
      contrasena: 'passwordIncorrecta123'
    };
    await expect(
      client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { input: loginInput }
      })
    ).rejects.toThrow(/credenciales|incorrectas|inválidas/i);
  });

  test('Validación de campos vacíos en cliente', () => {
    const emptyFields = { correo_electronico: '', contrasena: '' };

    const isEmailValid = emptyFields.correo_electronico.trim() !== '';
    const isPasswordValid = emptyFields.contrasena.trim() !== '';
    const areFieldsValid = isEmailValid && isPasswordValid;

    expect(areFieldsValid).toBe(false);
  });

  test('Acceso a recurso protegido con token válido', async () => {
    const loginInput = {
      correo_electronico: testUser.correo_electronico,
      contrasena: testUser.contrasena
    };
    const loginResponse = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { input: loginInput }
    });
    const token = loginResponse.data?.login?.token;
    console.log('Token recibido:', token);
    console.log('Respuesta completa del login:', JSON.stringify(loginResponse, null, 2));
    expect(token).toBeDefined();
    if (!token) {
      console.error('Token recibido es undefined o vacío:', loginResponse);
    }
    const authenticatedClient = new ApolloClient({
      link: createHttpLink({
        uri: serverUrl,
        fetch,
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
      cache: new InMemoryCache(),
    });
    const ME_QUERY = gql`
      query Me {
        me {
          id
          nombre_usuario
          correo_electronico
        }
      }
    `;
    const response = await authenticatedClient.query({ query: ME_QUERY });
    expect(response.data.me).toBeDefined();
    expect(response.data.me.correo_electronico).toBe(testUser.correo_electronico);
  });
});
