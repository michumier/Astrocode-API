import { query } from '../config/db';
import { ejecutarPython, normalizarSalida, ExecutionResult } from './pythonRunner';

export interface ResultadoTest {
  descripcion: string;
  oculto: boolean;
  superado: boolean;
  // Solo se rellenan en los tests visibles: de los ocultos el alumno no ve los datos
  esperado?: string | null;
  obtenido?: string | null;
  error?: string | null;
}

export interface Correccion {
  correcto: boolean;
  ejecucion: ExecutionResult;
  tests: {
    superados: number;
    total: number;
    resultados: ResultadoTest[];
  } | null;
}

/**
 * Corrige el código de un alumno para una tarea.
 * - Si la tarea tiene tests (tabla tests_tarea), se ejecuta el código + cada test.
 * - Si no, se compara la salida del programa con `resultado_esperado`.
 */
export async function corregirTarea(tarea: any, codigo: string): Promise<Correccion> {
  // Ejecución "normal" para enseñar al alumno la salida de su programa
  const ejecucion = await ejecutarPython(codigo);

  const tests = await query(
    'SELECT descripcion, codigo_test, entrada, salida_esperada, oculto FROM tests_tarea WHERE tarea_id = ? ORDER BY orden, id',
    [tarea.id]
  ) as any[];

  if (tests.length === 0) {
    const correcto =
      ejecucion.status.id === 3 &&
      !!tarea.resultado_esperado &&
      normalizarSalida(ejecucion.stdout) === normalizarSalida(tarea.resultado_esperado);
    return { correcto, ejecucion, tests: null };
  }

  // Si el propio código ya falla, no merece la pena lanzar los tests
  if (ejecucion.status.id !== 3) {
    return {
      correcto: false,
      ejecucion,
      tests: {
        superados: 0,
        total: tests.length,
        resultados: tests.map((t) => ({
          descripcion: t.oculto ? 'Test oculto' : t.descripcion,
          oculto: !!t.oculto,
          superado: false,
          error: 'Tu código da error antes de llegar a los tests',
        })),
      },
    };
  }

  const resultados: ResultadoTest[] = [];
  for (const test of tests) {
    const programa = test.codigo_test ? `${codigo}\n\n${test.codigo_test}` : codigo;
    const r = await ejecutarPython(programa, test.entrada || '');
    // La salida del test es lo último que imprime el programa (después de los prints del alumno)
    const salidaAlumno = normalizarSalida(ejecucion.stdout);
    let obtenido = normalizarSalida(r.stdout);
    if (test.codigo_test && salidaAlumno && obtenido.startsWith(salidaAlumno)) {
      obtenido = obtenido.slice(salidaAlumno.length).trim();
    }
    const superado = r.status.id === 3 && obtenido === normalizarSalida(test.salida_esperada);
    const oculto = !!test.oculto;
    resultados.push({
      descripcion: oculto ? 'Test oculto' : test.descripcion,
      oculto,
      superado,
      esperado: oculto ? null : test.salida_esperada,
      obtenido: oculto ? null : obtenido,
      error: r.status.id === 3 ? null : oculto ? 'Error de ejecución' : ultimaLinea(r.stderr),
    });
  }

  const superados = resultados.filter((r) => r.superado).length;
  return {
    correcto: superados === resultados.length,
    ejecucion,
    tests: { superados, total: resultados.length, resultados },
  };
}

const ultimaLinea = (texto: string) => texto.trim().split('\n').pop() || null;
