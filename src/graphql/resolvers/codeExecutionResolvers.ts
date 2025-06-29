import axios from 'axios';

interface ExecuteCodeInput {
  sourceCode: string;
  languageId?: number;
  stdin?: string;
}

interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status: {
    id: number;
    description: string;
  };
  time?: string;
  memory?: number;
}

// URL del contenedor Docker local (usando nombre del servicio)
const PYTHON_RUNNER_URL = process.env.PYTHON_RUNNER_URL || 'http://python-runner:5000';

// Configuración para peticiones HTTP al contenedor local
const HTTP_CONFIG = {
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // Timeout de 10 segundos
};

export const codeExecutionResolvers = {
  Mutation: {
    executeCode: async (_: any, { input }: { input: ExecuteCodeInput }): Promise<ExecutionResult> => {
      try {
        const { sourceCode, stdin = '' } = input;
        const startTime = Date.now();

        // Enviar código al contenedor Docker local
        const response = await axios.post(
          `${PYTHON_RUNNER_URL}/run`,
          {
            code: sourceCode
          },
          HTTP_CONFIG
        );

        const result = response.data;
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);

        // Determinar el estado basado en el exit_code
        let status;
        if (result.exit_code === 0) {
          status = { id: 3, description: 'Accepted' };
        } else if (result.exit_code === 124) {
          status = { id: 5, description: 'Time Limit Exceeded' };
        } else {
          status = { id: 6, description: 'Runtime Error' };
        }

        return {
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compile_output: '', // Python no tiene compilación separada
          status: status,
          time: executionTime,
          memory: 0 // El contenedor local no reporta uso de memoria específico
        };

      } catch (error: any) {
        console.error('Error executing code:', error);
        
        // Manejo de errores específicos
        if (error.response) {
          throw new Error(`Python Runner Error: ${error.response.status} - ${error.response.data?.stderr || 'Error desconocido'}`);
        } else if (error.request) {
          throw new Error('No se pudo conectar con el contenedor de ejecución de código Python. Asegúrate de que el contenedor esté ejecutándose.');
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error('Conexión rechazada: El contenedor Python Runner no está disponible en localhost:5000');
        } else {
          throw new Error(`Error interno: ${error.message}`);
        }
      }
    }
  }
};