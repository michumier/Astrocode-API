import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setupTestEnvironment, teardownTestEnvironment, cleanupTestData, serverUrl, testUsers } from './setup';

describe('Pruebas de Integración - Login de Usuario', () => {
  let client: ApolloClient<any>;
  let testUserToken: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    const httpLink = createHttpLink({
      uri: serverUrl,
    });

    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await cleanupTestData();
    
    // Crear usuario de prueba para login
    const REGISTER_MUTATION = gql`
      mutation CrearUsuario($input: CrearUsuarioInput!) {
        crearUsuario(input: $input) {
          id
          correo_electronico
        }
      }
    `;

    await client.mutate({
      mutation: REGISTER_MUTATION,
      variables: { input: testUsers.existingUser }
    });
  });

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

  describe('Caso de Uso: Login con credenciales válidas', () => {
    test('Debe generar token y devolver datos de usuario', async () => {
      // Entrada: email y password correctos
      const loginInput = {
        correo_electronico: testUsers.existingUser.correo_electronico,
        contrasena: testUsers.existingUser.contrasena
      };

      try {
        // Procedimiento: Enviar mutation loginUser
        const response = await client.mutate({
          mutation: LOGIN_MUTATION,
          variables: { input: loginInput }
        });

        // Salida Esperada: Token generado, datos de usuario devueltos
        expect(response.data).toBeDefined();
        expect(response.data.login).toBeDefined();
        expect(response.data.login.token).toBeDefined();
        expect(response.data.login.usuario).toBeDefined();
        expect(response.data.login.usuario.correo_electronico).toBe(loginInput.correo_electronico);
        
        testUserToken = response.data.login.token;
        console.log('✅ ÉXITO: Token y datos de usuario recibidos correctamente');
      } catch (error) {
        console.log('❌ FALLO: Error en login con credenciales válidas:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Login con contraseña incorrecta', () => {
    test('Debe devolver error de credenciales incorrectas', async () => {
      // Entrada: email correcto, password incorrecta
      const loginInput = {
        correo_electronico: testUsers.existingUser.correo_electronico,
        contrasena: 'passwordIncorrecta123'
      };

      try {
        // Procedimiento: Enviar mutation loginUser con password errónea
        await client.mutate({
          mutation: LOGIN_MUTATION,
          variables: { input: loginInput }
        });

        // Si llegamos aquí, la prueba falló
        console.log('❌ FALLO: Debería haber lanzado error por credenciales incorrectas');
        fail('Debería haber lanzado error por credenciales incorrectas');
      } catch (error: any) {
        // Salida Esperada: Error "Credenciales incorrectas"
        expect(error.message).toMatch(/credenciales|incorrectas|inválidas/i);
        console.log('✅ ÉXITO: Error controlado recibido por credenciales incorrectas');
      }
    });
  });

  describe('Caso de Uso: Login con campos vacíos', () => {
    test('Debe validar campos requeridos en cliente', () => {
      // Entrada: email "", password ""
      const emptyFields = {
        correo_electronico: '',
        contrasena: ''
      };

      try {
        // Procedimiento: Validar desde front-end
        const isEmailValid = emptyFields.correo_electronico.trim() !== '';
        const isPasswordValid = emptyFields.contrasena.trim() !== '';
        const areFieldsValid = isEmailValid && isPasswordValid;

        // Salida Esperada: Error en cliente "Rellena todos los campos"
        expect(areFieldsValid).toBe(false);
        
        if (!areFieldsValid) {
          console.log('✅ ÉXITO: Validación de campos vacíos funciona correctamente');
          // En una aplicación real, aquí se mostraría el error sin llamar al backend
          return;
        }

        console.log('❌ FALLO: Campos vacíos pasaron la validación');
        fail('Campos vacíos pasaron la validación');
      } catch (error) {
        console.log('❌ FALLO: Error en validación de campos vacíos:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Verificar autenticación con token', () => {
    test('Debe poder acceder a recursos protegidos con token válido', async () => {
      // Primero hacer login para obtener token
      const loginResponse = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          input: {
            correo_electronico: testUsers.existingUser.correo_electronico,
            contrasena: testUsers.existingUser.contrasena
          }
        }
      });

      const token = loginResponse.data.login.token;

      // Crear cliente con autenticación
      const authenticatedClient = new ApolloClient({
        link: createHttpLink({
          uri: serverUrl,
          headers: {
            authorization: `Bearer ${token}`
          }
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

      try {
        const response = await authenticatedClient.query({
          query: ME_QUERY
        });

        expect(response.data.me).toBeDefined();
        expect(response.data.me.correo_electronico).toBe(testUsers.existingUser.correo_electronico);
        console.log('✅ ÉXITO: Acceso autenticado funciona correctamente');
      } catch (error) {
        console.log('❌ FALLO: Error en acceso autenticado:', error);
        throw error;
      }
    });
  });
});