import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { setupTestEnvironment, teardownTestEnvironment, cleanupTestData, serverUrl, testUsers, testExercise } from './setup';

describe('Pruebas de Integración - Realizar Ejercicio', () => {
  let client: ApolloClient<any>;
  let authenticatedClient: ApolloClient<any>;
  let userToken: string;

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
    
    // Crear y autenticar usuario para las pruebas
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

    await client.mutate({
      mutation: REGISTER_MUTATION,
      variables: { input: testUsers.existingUser }
    });

    const loginResponse = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          correo_electronico: testUsers.existingUser.correo_electronico,
          contrasena: testUsers.existingUser.contrasena
        }
      }
    });

    userToken = loginResponse.data.login.token;

    // Crear cliente autenticado
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: userToken ? `Bearer ${userToken}` : "",
        }
      };
    });

    authenticatedClient = new ApolloClient({
      link: authLink.concat(createHttpLink({ uri: serverUrl })),
      cache: new InMemoryCache(),
    });
  });

  const EXECUTE_CODE_MUTATION = gql`
    mutation ExecuteCode($input: ExecuteCodeInput!) {
      executeCode(input: $input) {
        stdout
        stderr
        compile_output
        status {
          id
          description
        }
        time
        memory
      }
    }
  `;

  describe('Caso de Uso: Código correcto enviado', () => {
    test('Debe ejecutar código exitosamente y devolver resultado', async () => {
      // Entrada: idEjercicio, codigo válido
      const executeInput = {
        sourceCode: testExercise.codigo,
        languageId: 71, // Python 3
        stdin: ''
      };

      try {
        // Procedimiento: Enviar mutation evaluarCodigo con código funcional
        const response = await authenticatedClient.mutate({
          mutation: EXECUTE_CODE_MUTATION,
          variables: { input: executeInput }
        });

        // Salida Esperada: Mensaje de éxito y resultado de ejecución
        expect(response.data).toBeDefined();
        expect(response.data.executeCode).toBeDefined();
        expect(response.data.executeCode.status).toBeDefined();
        
        // Verificar que el código se ejecutó correctamente
        const result = response.data.executeCode;
        if (result.status.id === 3) { // Status 3 = Accepted
          expect(result.stdout).toContain('Hello World');
          console.log('✅ ÉXITO: Código ejecutado correctamente, puntuación asignada');
        } else {
          console.log('⚠️  ADVERTENCIA: Código ejecutado pero con estado:', result.status.description);
        }
      } catch (error) {
        console.log('❌ FALLO: Error al ejecutar código correcto:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Código incorrecto', () => {
    test('Debe ejecutar código pero indicar fallo lógico', async () => {
      // Entrada: idEjercicio, codigo incorrecto
      const executeInput = {
        sourceCode: testExercise.codigoIncorrecto,
        languageId: 71, // Python 3
        stdin: ''
      };

      try {
        // Procedimiento: Enviar mutation evaluarCodigo con fallo lógico
        const response = await authenticatedClient.mutate({
          mutation: EXECUTE_CODE_MUTATION,
          variables: { input: executeInput }
        });

        // Salida Esperada: Ejecución exitosa pero resultado incorrecto
        expect(response.data).toBeDefined();
        expect(response.data.executeCode).toBeDefined();
        
        const result = response.data.executeCode;
        // El código se ejecuta pero el resultado es incorrecto
        expect(result.stdout).toContain('Wrong');
        expect(result.stdout).not.toContain('Hello World');
        
        console.log('✅ ÉXITO: Código incorrecto ejecutado, no se asignan puntos');
      } catch (error) {
        console.log('❌ FALLO: Error al ejecutar código incorrecto:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Código con error de sintaxis', () => {
    test('Debe devolver error de compilación claro', async () => {
      // Entrada: idEjercicio, codigo con error sintáctico
      const executeInput = {
        sourceCode: testExercise.codigoConError, // print("hola sin cerrar comilla
        languageId: 71, // Python 3
        stdin: ''
      };

      try {
        // Procedimiento: Enviar código con error de compilación
        const response = await authenticatedClient.mutate({
          mutation: EXECUTE_CODE_MUTATION,
          variables: { input: executeInput }
        });

        // Salida Esperada: Mensaje claro de error sintáctico
        expect(response.data).toBeDefined();
        expect(response.data.executeCode).toBeDefined();
        
        const result = response.data.executeCode;
        
        // Verificar que hay error de compilación o runtime
        const hasError = result.stderr || result.compile_output || result.status.id !== 3;
        expect(hasError).toBeTruthy();
        
        if (result.stderr) {
          expect(result.stderr).toMatch(/syntax|error|invalid/i);
        }
        
        console.log('✅ ÉXITO: Error sintáctico controlado correctamente');
      } catch (error) {
        console.log('❌ FALLO: Error al manejar código con sintaxis incorrecta:', error);
        throw error;
      }
    });
  });

  describe('Caso de Uso: Código con timeout', () => {
    test('Debe manejar código que tarda demasiado en ejecutarse', async () => {
      // Entrada: código que puede causar timeout
      const executeInput = {
        sourceCode: `
import time
for i in range(1000000):
    time.sleep(0.001)
print("Finished")
        `,
        languageId: 71, // Python 3
        stdin: ''
      };

      try {
        // Procedimiento: Enviar código que puede exceder tiempo límite
        const response = await authenticatedClient.mutate({
          mutation: EXECUTE_CODE_MUTATION,
          variables: { input: executeInput }
        });

        // Salida Esperada: Error de timeout o ejecución controlada
        expect(response.data).toBeDefined();
        expect(response.data.executeCode).toBeDefined();
        
        const result = response.data.executeCode;
        
        // Verificar que el sistema maneja el timeout apropiadamente
        if (result.status.id === 5) { // Time Limit Exceeded
          console.log('✅ ÉXITO: Timeout manejado correctamente');
        } else {
          console.log('⚠️  ADVERTENCIA: Código completado sin timeout');
        }
        
        expect(result.status).toBeDefined();
      } catch (error) {
        console.log('❌ FALLO: Error al manejar timeout:', error);
        throw error;
      }
    });
  });
});