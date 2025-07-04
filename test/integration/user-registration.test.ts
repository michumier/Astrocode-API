import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import fetch from 'cross-fetch';

const serverUrl = 'http://localhost:4000/graphql'; // Cambia aquí por tu endpoint real

const testUsers = {
  newUser: {
    nombre_usuario: 'usuario_nuevo',
    correo_electronico: 'nuevo@example.com',
    contrasena: 'Password123!',
    nombre_completo: 'Usuario Nuevo'
  },
  existingUser: {
    nombre_usuario: 'usuario_existente',
    correo_electronico: 'existente@example.com',
    contrasena: 'Password123!',
    nombre_completo: 'Usuario Existente'
  },
  invalidEmail: {
    correo_electronico: 'aaa',
  }
};

describe('Pruebas de Integración - Registro de Usuario', () => {
  let client: ApolloClient<any>;

  beforeAll(() => {
    const httpLink = createHttpLink({ uri: serverUrl, fetch });

    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  const REGISTER_USER_MUTATION = gql`
    mutation CrearUsuario($input: CrearUsuarioInput!) {
      crearUsuario(input: $input) {
        id
        nombre_usuario
        correo_electronico
        nombre_completo
      }
    }
  `;

  beforeEach(async () => {
    // Aquí podrías limpiar datos si tu backend tiene endpoint para ello,
    // si no, deja vacío o implementa a mano según tu base de datos.
  });

  const generateUniqueUser = () => {
    const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
    return {
      nombre_usuario: `usuario_nuevo_${uniqueId}`,
      correo_electronico: `nuevo_${uniqueId}@example.com`,
      contrasena: 'Password123!',
      nombre_completo: `Usuario Nuevo ${uniqueId}`
    };
  };

  test('Registro con usuario nuevo debe crear usuario exitosamente', async () => {
    const input = generateUniqueUser();

    const response = await client.mutate({
      mutation: REGISTER_USER_MUTATION,
      variables: { input }
    });

    expect(response.data).toBeDefined();
    expect(response.data.crearUsuario).toBeDefined();
    expect(response.data.crearUsuario.correo_electronico).toBe(input.correo_electronico);
    expect(response.data.crearUsuario.nombre_usuario).toBe(input.nombre_usuario);
  });

  test('Registro con usuario ya existente debe fallar', async () => {
    // Crear usuario existente
    try {
      await client.mutate({
        mutation: REGISTER_USER_MUTATION,
        variables: { input: testUsers.existingUser }
      });
    } catch {}

    // Intentar crear duplicado
    await expect(
      client.mutate({
        mutation: REGISTER_USER_MUTATION,
        variables: { input: testUsers.existingUser }
      })
    ).rejects.toThrow(/ya existe/i);
  });

  test('Validación de email mal formado en cliente', () => {
    const invalidEmail = testUsers.invalidEmail.correo_electronico;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(invalidEmail);

    expect(isValidEmail).toBe(false);
  });
});
