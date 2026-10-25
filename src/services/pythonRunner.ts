import axios from 'axios';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

// URL del contenedor Docker local (usando nombre del servicio)
const PYTHON_RUNNER_URL = process.env.PYTHON_RUNNER_URL || 'http://python-runner:5000';

// Límite de tamaño del código para no saturar el runner
const MAX_CODE_LENGTH = 20000;

export async function ejecutarPython(sourceCode: string, stdin = ''): Promise<ExecutionResult> {
  if (sourceCode.length > MAX_CODE_LENGTH) {
    throw new Error(`El código no puede superar ${MAX_CODE_LENGTH} caracteres`);
  }

  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${PYTHON_RUNNER_URL}/run`,
      { code: sourceCode, stdin },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
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
      status,
      time: executionTime,
      memory: 0, // El contenedor local no reporta uso de memoria específico
    };
  } catch (error: any) {
    console.error('Error ejecutando código:', error.message);
    if (error.response) {
      throw new Error(`Python Runner Error: ${error.response.status} - ${error.response.data?.stderr || 'Error desconocido'}`);
    }
    throw new Error('No se pudo conectar con el contenedor de ejecución de código Python. Asegúrate de que el contenedor esté ejecutándose.');
  }
}

export interface VarianteMutada {
  codigo: string;
  operador: string;
  descripcion: string;
  linea: number;
  lineas_cambiadas: number;
  diff: string;
}

// Pide al runner variantes saboteadas de un programa (las analiza con ast, no las ejecuta)
export async function mutarCodigo(codigo: string, max = 12, semilla = 0): Promise<VarianteMutada[]> {
  try {
    const { data } = await axios.post(
      `${PYTHON_RUNNER_URL}/mutate`,
      { code: codigo, max, semilla },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return data.variantes || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'No se pudo conectar con el python-runner para generar sabotajes');
  }
}

// Compara salidas ignorando saltos de línea Windows/Unix y espacios al final de cada línea
export function normalizarSalida(texto: string): string {
  return texto
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((linea) => linea.trimEnd())
    .join('\n')
    .trim();
}
