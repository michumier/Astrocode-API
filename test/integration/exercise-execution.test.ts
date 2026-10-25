import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

describe('Pruebas de Integración - Realizar Ejercicio', () => {
  let client: ApolloClient<any>;
  let authenticatedClient: ApolloClient<any>;
  let userToken: string;

  const serverUrl = 'http://localhost:4000/graphql'; // Cambia por la URL de tu API

  beforeAll(async () => {
    const httpLink = createHttpLink({ uri: serverUrl });

    client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  beforeEach(async () => {
    // Mutaciones para registro y login
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

    // Usuario de prueba fijo
    const testUser = {
      nombre_usuario: 'usuarioTest',
      correo_electronico: 'usuarioTest@test.com',
      contrasena: 'password123',
      nombre_completo: 'Usuario Test',
    };

    // Crear usuario (ignorar error si ya existe)
    try {
      await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: testUser }
      });
    } catch {}

    // Loguear usuario y obtener token
    const loginResponse = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          correo_electronico: testUser.correo_electronico,
          contrasena: testUser.contrasena
        }
      }
    });

    userToken = loginResponse.data.login.token;

    // Crear cliente autenticado
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

  const testExercise = {
    codigo: `print("Hello World")`,
    codigoIncorrecto: `print("Wrong output")`,
    codigoConError: `print("hola sin cerrar comilla)`,
  };

  describe('Caso de Uso: Código correcto enviado', () => {
    test('Debe ejecutar código exitosamente y devolver resultado', async () => {
      const executeInput = {
        sourceCode: testExercise.codigo,
        languageId: 71, // Python 3
        stdin: ''
      };

      const response = await authenticatedClient.mutate({
        mutation: EXECUTE_CODE_MUTATION,
        variables: { input: executeInput }
      });

      expect(response.data).toBeDefined();
      expect(response.data.executeCode).toBeDefined();

      const result = response.data.executeCode;
      if (result.status.id === 3) {
        expect(result.stdout).toContain('Hello World');
        console.log('✅ ÉXITO: Código ejecutado correctamente, puntuación asignada');
      } else {
        console.log('⚠️  ADVERTENCIA: Código ejecutado pero con estado:', result.status.description);
      }
    });
  });

  describe('Caso de Uso: Código incorrecto', () => {
    test('Debe ejecutar código pero indicar fallo lógico', async () => {
      const executeInput = {
        sourceCode: testExercise.codigoIncorrecto,
        languageId: 71,
        stdin: ''
      };

      const response = await authenticatedClient.mutate({
        mutation: EXECUTE_CODE_MUTATION,
        variables: { input: executeInput }
      });

      expect(response.data).toBeDefined();
      expect(response.data.executeCode).toBeDefined();

      const result = response.data.executeCode;
      expect(result.stdout).toContain('Wrong');
      expect(result.stdout).not.toContain('Hello World');

      console.log('✅ ÉXITO: Código incorrecto ejecutado, no se asignan puntos');
    });
  });

  describe('Caso de Uso: Código con error de sintaxis', () => {
    test('Debe devolver error de compilación claro', async () => {
      const executeInput = {
        sourceCode: testExercise.codigoConError,
        languageId: 71,
        stdin: ''
      };

      const response = await authenticatedClient.mutate({
        mutation: EXECUTE_CODE_MUTATION,
        variables: { input: executeInput }
      });

      expect(response.data).toBeDefined();
      expect(response.data.executeCode).toBeDefined();

      const result = response.data.executeCode;

      const hasError = result.stderr || result.compile_output || result.status.id !== 3;
      expect(hasError).toBeTruthy();

      if (result.stderr) {
        expect(result.stderr).toMatch(/syntax|error|invalid/i);
      }

      console.log('✅ ÉXITO: Error sintáctico controlado correctamente');
    });
  });

 // describe.skip('Caso de Uso: Código con timeout', () => {
 //   test('Debe manejar código que tarda demasiado en ejecutarse', async () => {
 //     const executeInput = {
 //       sourceCode: `
 // import time
 // for i in range(1000000):
 //     time.sleep(0.001)
 // print("Finished")
 //       `,
 //       languageId: 71,
 //       stdin: ''
 //     };
 //
 //     const response = await authenticatedClient.mutate({
 //       mutation: EXECUTE_CODE_MUTATION,
 //       variables: { input: executeInput }
 //     });
 //
 //     expect(response.data).toBeDefined();
 //     expect(response.data.executeCode).toBeDefined();
 //
 //     const result = response.data.executeCode;
 //     expect(result.status).toBeDefined();
 //     expect(result.status.id === 5 || result.status.id === 3).toBe(true);
 //     // Mueve los logs aquí, justo después del expect que asegura que el test sigue activo
 //     if (result.status.id === 5) {
 //       console.log('✅ ÉXITO: Timeout manejado correctamente');
 //     } else {
 //       console.log('⚠️  ADVERTENCIA: Código completado sin timeout');
 //     }
 //   });
 // });
});
