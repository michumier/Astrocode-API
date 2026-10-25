import { query } from '../../config/db';
import { Context, requireAuth, requireAdmin, UserInputError, ForbiddenError } from '../errors';
import { iaDisponible, generarPista, generarEjercicio, EjercicioIA } from '../../services/ia';
import { ejecutarPython, normalizarSalida } from '../../services/pythonRunner';
import { puedeAbrirTarea, sabotajePorTarea } from '../../services/sabotajes';

const PISTAS_POR_DIA = Number(process.env.PISTAS_POR_DIA || 20);

const comprobarIa = () => {
  if (!iaDisponible()) {
    throw new UserInputError('El asistente de IA no está activado en este servidor');
  }
};

// Ejecuta un test contra un código y dice si la salida coincide
const pasaTest = async (codigo: string, test: { codigoTest: string; salidaEsperada: string }) => {
  const r = await ejecutarPython(`${codigo}\n\n${test.codigoTest}`);
  return r.status.id === 3 && normalizarSalida(r.stdout) === normalizarSalida(test.salidaEsperada);
};

export const iaResolvers = {
  Query: {
    iaDisponible: () => iaDisponible(),

    pistasRestantesHoy: async (_: any, __: any, context: Context) => {
      const usuario = requireAuth(context);
      const filas = await query(
        'SELECT COUNT(*) AS usadas FROM pistas_ia WHERE usuario_id = ? AND creado_el >= UTC_DATE()',
        [usuario.id]
      ) as any[];
      return Math.max(0, PISTAS_POR_DIA - Number(filas[0].usadas));
    },
  },

  Mutation: {
    // Pista progresiva (nivel 1-3) del tutor de IA. Nunca da la solución.
    pedirPista: async (
      _: any,
      { tareaId, codigo, salida, nivel = 1 }: { tareaId: string; codigo: string; salida?: string; nivel?: number },
      context: Context
    ) => {
      const usuario = requireAuth(context, 'Debes iniciar sesión para pedir pistas');
      comprobarIa();

      const usadas = await query(
        'SELECT COUNT(*) AS usadas FROM pistas_ia WHERE usuario_id = ? AND creado_el >= UTC_DATE()',
        [usuario.id]
      ) as any[];
      if (Number(usadas[0].usadas) >= PISTAS_POR_DIA) {
        throw new ForbiddenError(`Has usado tus ${PISTAS_POR_DIA} pistas de hoy. ¡Mañana tendrás más!`);
      }

      const tareas = await query('SELECT id, titulo, descripcion, solucion, tipo, config FROM tareas WHERE id = ?', [tareaId]) as any[];
      if (tareas.length === 0) {
        throw new UserInputError('Tarea no encontrada');
      }
      const tarea = tareas[0];
      if (!(await puedeAbrirTarea(usuario, tarea))) {
        throw new ForbiddenError('Completa primero el ejercicio original para desbloquear este sabotaje');
      }
      const sabotaje = tarea.tipo === 'sabotaje' ? await sabotajePorTarea(tarea.id) : null;

      // Tests visibles, para que la IA sepa qué se espera
      const tests = await query(
        'SELECT descripcion, salida_esperada FROM tests_tarea WHERE tarea_id = ? AND oculto = 0 ORDER BY orden',
        [tareaId]
      ) as any[];

      const pista = await generarPista({
        titulo: tarea.titulo,
        enunciado: tarea.descripcion,
        codigo: codigo.slice(0, 8000),
        salida,
        solucion: tarea.solucion,
        testsFallidos: tests.map((t) => `${t.descripcion} → debería dar ${t.salida_esperada}`),
        nivel: Math.min(Math.max(Math.floor(nivel), 1), 3),
        sabotaje: sabotaje ? { descripcion: sabotaje.descripcion, linea: sabotaje.linea, diff: sabotaje.diff } : null,
      });

      await query('INSERT INTO pistas_ia (usuario_id, tarea_id) VALUES (?, ?)', [usuario.id, tareaId]);
      return {
        pista,
        nivel: Math.min(Math.max(Math.floor(nivel), 1), 3),
        restantesHoy: Math.max(0, PISTAS_POR_DIA - Number(usadas[0].usadas) - 1),
      };
    },

    // Borrador de ejercicio generado por IA. Los tests se VERIFICAN en el sandbox:
    // solo se devuelven los que la solución de referencia supera. No se guarda nada:
    // el admin lo revisa y lo guarda con crearTarea.
    generarEjercicio: async (
      _: any,
      { tema, nivelId, categoriaId }: { tema: string; nivelId: string; categoriaId: string },
      context: Context
    ) => {
      requireAdmin(context);
      comprobarIa();

      const niveles = await query('SELECT nombre FROM niveles WHERE id = ?', [nivelId]) as any[];
      const categorias = await query('SELECT nombre FROM categorias WHERE id = ?', [categoriaId]) as any[];
      if (!niveles.length || !categorias.length) {
        throw new UserInputError('Nivel o categoría no válidos');
      }

      const ejercicio = await generarEjercicio({
        tema: tema.slice(0, 300),
        nivel: niveles[0].nombre,
        categoria: categorias[0].nombre,
      });

      const avisos: string[] = [];
      const testsValidos: EjercicioIA['tests'] = [];
      for (const test of ejercicio.tests) {
        if (await pasaTest(ejercicio.solucion, test)) {
          testsValidos.push(test);
        } else {
          avisos.push(`Descartado un test que la propia solución no supera: "${test.descripcion}"`);
        }
      }

      if (testsValidos.length === 0) {
        throw new UserInputError('La IA generó tests incorrectos. Vuelve a intentarlo con otro tema.');
      }

      // El código base no debería superar todos los tests (si no, el ejercicio no tiene sentido)
      if (ejercicio.codigoBase) {
        const resultados = await Promise.all(testsValidos.map((t) => pasaTest(ejercicio.codigoBase, t)));
        if (resultados.every(Boolean)) {
          avisos.push('Ojo: el código base ya supera todos los tests.');
        }
      }
      if (!testsValidos.some((t) => t.oculto)) {
        avisos.push('No quedó ningún test oculto: conviene añadir alguno antes de publicarlo.');
      }

      return { ...ejercicio, tests: testsValidos, testsGenerados: ejercicio.tests.length, avisos };
    },
  },
};
