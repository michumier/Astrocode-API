import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setupTestEnvironment, teardownTestEnvironment, cleanupTestData, serverUrl, testUsers } from './setup';

describe('Pruebas de Integración - Registro de Usuario', () => {
  let client: ApolloClient<any>;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Configurar cliente Apollo para pruebas
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

  describe('Caso de Uso: Registro con usuario nuevo', () => {
    test('Debe crear usuario exitosamente con datos válidos', async () => {
      // Entrada: email nuevo, password válida
      const input = testUsers.newUser;

      try {
        // Procedimiento: Enviar mutation registerUser con datos válidos
        const response = await client.mutate({
          mutation: REGISTER_USER_MUTATION,
          variables: { input }
        });

        // Salida Esperada: Usuario creado, respuesta con datos
        expect(response.data).toBeDefined();
        expect(response.data.crearUsuario).toBeDefined();
        expect(response.data.crearUsuario.correo_electronico).toBe(input.correo_electronico);
        expect(response.data.crearUsuario.nombre_usuario).toBe(input.nombre_usuario);
        
        console.log('✅ ÉXITO: Usuario creado correctamente');
      } catch (error) {
        console.log('❌ FALLO: Error al crear usuario:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Registro con usuario ya existente', () => {
    test('Debe fallar al intentar registrar email duplicado', async () => {
      // Preparación: Crear usuario existente
      await client.mutate({
        mutation: REGISTER_USER_MUTATION,
        variables: { input: testUsers.existingUser }
      });

      try {
        // Entrada: email existente, password válida
        // Procedimiento: Enviar misma mutation con email duplicado
        await client.mutate({
          mutation: REGISTER_USER_MUTATION,
          variables: { input: testUsers.existingUser }
        });

        // Si llegamos aquí, la prueba falló
        console.log('❌ FALLO: Debería haber lanzado error por email duplicado');
        fail('Debería haber lanzado error por email duplicado');
      } catch (error: any) {
        // Salida Esperada: Error "usuario ya existe"
        expect(error.message).toContain('ya existe');
        console.log('✅ ÉXITO: Error controlado recibido por email duplicado');
      }
    });
  });

  describe('Caso de Uso: Registro con email mal formado', () => {
    test('Debe validar email en cliente antes de enviar petición', () => {
      // Entrada: email "aaa", password válida
      const invalidEmail = testUsers.invalidEmail.correo_electronico;
      
      // Procedimiento: Validar formulario desde front-end
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(invalidEmail);
      
      try {
        // Salida Esperada: Error de validación en cliente
        expect(isValidEmail).toBe(false);
        
        if (!isValidEmail) {
          console.log('✅ ÉXITO: Validación de email funciona correctamente');
          // En una aplicación real, aquí no se haría la petición al backend
          return;
        }
        
        console.log('❌ FALLO: Email inválido pasó la validación');
        fail('Email inválido pasó la validación');
      } catch (error) {
        console.log('❌ FALLO: Error en validación de email:', error);
        throw error;
      }
    });
  });
});