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

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const PYTHON_LANGUAGE_ID = 71; // Python 3.8.1

// Configuración de RapidAPI para Judge0
const RAPIDAPI_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '', // Agregar tu API key aquí
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
  }
};

export const codeExecutionResolvers = {
  Mutation: {
    executeCode: async (_: any, { input }: { input: ExecuteCodeInput }): Promise<ExecutionResult> => {
      try {
        const { sourceCode, languageId = PYTHON_LANGUAGE_ID, stdin = '' } = input;

        // Crear submission en Judge0
        const submissionResponse = await axios.post(
          `${JUDGE0_API_URL}/submissions`,
          {
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin,
            wait: true, // Esperar a que termine la ejecución
            cpu_time_limit: 5, // Límite de 5 segundos
            memory_limit: 128000 // Límite de 128MB
          },
          RAPIDAPI_CONFIG
        );

        const submission = submissionResponse.data;

        // Si no se ejecutó inmediatamente, obtener el resultado
        let result = submission;
        if (!submission.stdout && !submission.stderr && submission.token) {
          const resultResponse = await axios.get(
            `${JUDGE0_API_URL}/submissions/${submission.token}`,
            RAPIDAPI_CONFIG
          );
          result = resultResponse.data;
        }

        return {
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compile_output: result.compile_output || '',
          status: result.status || { id: 0, description: 'Unknown' },
          time: result.time || '0',
          memory: result.memory || 0
        };

      } catch (error: any) {
        console.error('Error executing code:', error);
        
        // Manejo de errores específicos
        if (error.response) {
          throw new Error(`Judge0 API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('No se pudo conectar con el servicio de ejecución de código');
        } else {
          throw new Error(`Error interno: ${error.message}`);
        }
      }
    }
  }
};