import { ExecutionResult } from './pythonRunner';

/**
 * Clasifica el resultado de un envío para guardarlo en `intentos.tipo_error`.
 * - null si fue correcto
 * - el tipo de excepción de Python (NameError, IndentationError...) si el código dio error
 * - 'Timeout' / 'LimiteMemoria' si lo cortó el sandbox
 * - 'TestsFallidos' o 'SalidaIncorrecta' si se ejecutó bien pero no hace lo que se pide
 */
export function clasificarError(ejecucion: ExecutionResult, correcto: boolean, conTests: boolean): string | null {
  if (correcto) return null;

  if (ejecucion.status.id === 5) return 'Timeout';

  if (ejecucion.status.id !== 3) {
    return tipoExcepcion(ejecucion.stderr) || 'ErrorDeEjecucion';
  }

  return conTests ? 'TestsFallidos' : 'SalidaIncorrecta';
}

// Extrae "NameError" de un traceback cuya última línea es "NameError: name 'x' is not defined"
export function tipoExcepcion(stderr: string): string | null {
  if (/superó el límite de tiempo o de memoria|MemoryError/.test(stderr)) {
    return 'LimiteMemoria';
  }
  const lineas = stderr.trim().split('\n').reverse();
  for (const linea of lineas) {
    const m = linea.match(/^([A-Za-z_][\w.]*(?:Error|Exception|Exit|Interrupt|Warning)|StopIteration|KeyboardInterrupt)\b/);
    if (m) {
      // "builtins.ValueError" → "ValueError"
      return m[1].split('.').pop() || m[1];
    }
  }
  return null;
}
