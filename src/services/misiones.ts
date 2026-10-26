import { ejecutarMision, EscenarioMision, ResultadoEscenario, ExecutionResult } from './pythonRunner';
import { tipoExcepcion } from './errores';

/*
 * Misiones de pilotaje (fase 2). La tarea guarda en `config` la misión y sus escenarios:
 *   { "mision": "aterrizaje", "escenarios": [{ nombre, semilla, params, oculto }] }
 * El runner simula cada escenario con el código del alumno en un proceso aparte.
 * Los escenarios ocultos solo devuelven si se superaron (ni fotogramas ni registro).
 */

export interface ConfigMision {
  mision: string;
  escenarios: EscenarioMision[];
}

export interface ResultadoMision {
  correcto: boolean;
  estrellas: number;
  superados: number;
  total: number;
  escenarios: ResultadoEscenario[];
}

export function configMision(tarea: { config?: any }): ConfigMision {
  const config = typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config;
  if (!config?.mision || !Array.isArray(config.escenarios) || config.escenarios.length === 0) {
    throw new Error('La misión no tiene escenarios configurados');
  }
  return config;
}

// Datos públicos de la misión para el cliente: nunca la semilla ni los parámetros de los ocultos
export function infoMision(tarea: { config?: any }) {
  const { mision, escenarios } = configMision(tarea);
  const visibles = escenarios.filter((e) => !e.oculto);
  return {
    id: mision,
    escenarios: visibles.map((e, i) => e.nombre || `Escenario ${i + 1}`),
    ocultos: escenarios.length - visibles.length,
  };
}

const resumir = (resultados: ResultadoEscenario[]): ResultadoMision => {
  const superados = resultados.filter((r) => r.exito).length;
  const correcto = superados === resultados.length;
  return {
    correcto,
    // Las estrellas de la misión son las del peor escenario
    estrellas: correcto ? Math.min(...resultados.map((r) => r.estrellas)) : 0,
    superados,
    total: resultados.length,
    escenarios: resultados,
  };
};

/** Corrección completa: todos los escenarios (los ocultos sin detalle). */
export async function corregirMision(tarea: { config?: any }, codigo: string): Promise<ResultadoMision> {
  const { mision, escenarios } = configMision(tarea);
  return resumir(await ejecutarMision(codigo, mision, escenarios));
}

/** «Probar»: solo un escenario visible, con todo el detalle, sin corregir ni puntuar. */
export async function probarEscenario(tarea: { config?: any }, codigo: string, indiceVisible = 0): Promise<ResultadoMision> {
  const { mision, escenarios } = configMision(tarea);
  const visibles = escenarios.filter((e) => !e.oculto);
  const escenario = visibles[Math.min(Math.max(Math.floor(indiceVisible), 0), visibles.length - 1)];
  return resumir(await ejecutarMision(codigo, mision, [{ ...escenario, oculto: false }]));
}

/** Resumen como si fuera una ejecución normal (para la terminal y el registro de intentos). */
export function comoEjecucion(r: ResultadoMision): ExecutionResult {
  const conError = r.escenarios.find((e) => e.error_codigo);
  const lineas = r.escenarios.map((e) => `${e.exito ? '✅' : '❌'} ${e.oculto ? 'Escenario oculto' : e.nombre}: ${e.oculto && !e.exito ? 'misión fallida' : e.motivo}`);
  return {
    stdout: lineas.join('\n'),
    stderr: conError ? conError.motivo : '',
    compile_output: '',
    status: conError
      ? /no respondió a tiempo|tiempo máximo|tardó demasiado/.test(conError.motivo)
        ? { id: 5, description: 'Time Limit Exceeded' }
        : { id: 6, description: 'Runtime Error' }
      : { id: 3, description: 'Accepted' },
    time: '0',
    memory: 0,
  };
}

/** Tipo de error para la tabla intentos. */
export function tipoErrorMision(r: ResultadoMision): string | null {
  if (r.correcto) return null;
  const conError = r.escenarios.find((e) => e.error_codigo);
  if (!conError) return 'MisionFallida';
  if (/no respondió a tiempo|tiempo máximo|tardó demasiado/.test(conError.motivo)) return 'Timeout';
  if (/devolvió None|no válida|No has definido/.test(conError.motivo)) return 'AccionInvalida';
  return tipoExcepcion(conError.motivo) || 'ErrorDeEjecucion';
}

// Para GraphQL: fotogramas, escena y métricas viajan como JSON en texto
export const escenarioParaGraphQL = (e: ResultadoEscenario) => ({
  nombre: e.nombre,
  oculto: e.oculto,
  exito: e.exito,
  // De los ocultos que fallan no se cuenta el motivo exacto (podría dar pistas del escenario)
  motivo: e.oculto && !e.exito ? 'La misión falló en este escenario oculto' : e.motivo,
  ticks: e.ticks,
  estrellas: e.estrellas,
  metricas: e.oculto ? null : JSON.stringify(e.metricas),
  fotogramas: e.fotogramas ? JSON.stringify(e.fotogramas) : null,
  escena: e.escena ? JSON.stringify(e.escena) : null,
  registro: e.registro || [],
});

export const misionParaGraphQL = (r: ResultadoMision) => ({
  estrellas: r.estrellas,
  superados: r.superados,
  total: r.total,
  escenarios: r.escenarios.map(escenarioParaGraphQL),
});
