import crypto from 'crypto';
import { query, transaction } from '../config/db';
import { mutarCodigo } from './pythonRunner';
import { evaluarCodigo, Evaluacion } from './correccion';
import { diffLineas } from './diffLineas';
import { iaDisponible, generarSabotajeIA } from './ia';

/*
 * Misiones de sabotaje (fase 1).
 *
 * 1. Se parte de una tarea con solución de referencia y tests.
 * 2. El mutador AST del runner genera variantes con un bug cada una (y, opcionalmente, la IA).
 * 3. Cada variante se VERIFICA en el sandbox: debe ejecutarse sin error de sintaxis y fallar
 *    al menos un test (si no falla ninguno, el cambio es equivalente y no es un bug).
 * 4. El admin publica las que quiera: se crea una tarea tipo 'sabotaje' con el código roto
 *    como código base y los mismos tests. Se desbloquea al completar la tarea original.
 */

export type Dificultad = 'facil' | 'media' | 'dificil';

// Ambientación por tipo de bug (sin revelar dónde está)
const CONTEXTOS: Record<string, string[]> = {
  comparacion: [
    'Los sensores de proximidad dan falsas alarmas justo en el límite. Alguien ha tocado una condición…',
    'El sistema de acoplamiento falla solo en los casos frontera. Revisa las comparaciones.',
  ],
  aritmetica: [
    'El ordenador de navegación calcula rutas imposibles. Alguien ha manipulado los cálculos.',
    'Los informes de combustible no cuadran: las cuentas de la nave están saboteadas.',
  ],
  desplazamiento: [
    'Al sistema de inventario siempre le falta (o le sobra) un elemento. Algo está desplazado.',
    'La telemetría pierde el primer o el último dato de cada ráfaga.',
  ],
  booleano: [
    'Los protocolos de seguridad se activan cuando no deben. La lógica de la nave está alterada.',
  ],
  negacion: [
    'El piloto automático hace justo lo contrario de lo que debería en algunos casos.',
  ],
  valor_inicial: [
    'Los contadores de la nave arrancan con un valor extraño cada vez que se reinician.',
  ],
  return: [
    'El módulo devuelve datos que no son los que la tripulación pidió.',
  ],
  sangria: [
    'Una instrucción se ejecuta demasiadas o demasiado pocas veces. Algo se ha movido de sitio.',
  ],
  mutable: [
    'La pila de tareas de la nave atiende las órdenes en el orden equivocado.',
  ],
  min_max: [
    'El sistema elige siempre la opción opuesta a la que debería (la más lejana en vez de la más cercana…).',
  ],
};

const contextoPorDefecto = (operador: string, semilla: number) => {
  const opciones = CONTEXTOS[operador] || ['Un saboteador ha alterado el código de la nave. Encuentra el fallo y repáralo.'];
  return opciones[semilla % opciones.length];
};

export function calcularDificultad(ev: Evaluacion): Dificultad {
  const fallidos = ev.fallidosVisibles + ev.fallidosOcultos;
  if (ev.fallidosVisibles === 0) return 'dificil'; // solo se ve en los tests ocultos
  return fallidos / ev.total >= 0.5 ? 'facil' : 'media';
}

// Un sabotaje vale si el programa se ejecuta (no es un error de sintaxis) y falla al menos un test.
// Los que fallan todos los tests también valen: son los más fáciles de detectar.
export const esSabotajeValido = (ev: Evaluacion) =>
  ev.seEjecuta && ev.total >= 2 && ev.fallidosVisibles + ev.fallidosOcultos >= 1;

const hash = (texto: string) => crypto.createHash('sha256').update(texto).digest('hex');

const firmas = (codigo: string) =>
  codigo.split('\n').filter((l) => /^\s*(def|class)\s/.test(l)).map((l) => l.trim()).join('\n');

export async function tareaSaboteable(tareaId: string | number) {
  const filas = await query(
    `SELECT t.id, t.titulo, t.descripcion, t.solucion, t.tipo, COUNT(tt.id) AS tests
     FROM tareas t LEFT JOIN tests_tarea tt ON tt.tarea_id = t.id
     WHERE t.id = $1 GROUP BY t.id`,
    [tareaId]
  ) as any[];
  const tarea = filas[0];
  if (!tarea) throw new Error('Tarea no encontrada');
  if (tarea.tipo !== 'codigo') throw new Error('Solo se pueden sabotear tareas de código normales');
  if (!tarea.solucion) throw new Error('La tarea no tiene solución de referencia');
  if (Number(tarea.tests) < 2) throw new Error('La tarea necesita al menos 2 tests para poder sabotearla');
  return tarea;
}

interface Candidato {
  codigo: string;
  operador: string;
  descripcion: string;
  linea: number | null;
  lineasCambiadas: number;
  diff: string;
  contexto: string | null;
  origen: 'ast' | 'ia';
}

/**
 * Genera hasta `cantidad` sabotajes nuevos y verificados para una tarea y los guarda sin publicar.
 * Devuelve los ids guardados en esta llamada.
 */
export async function generarSabotajes(tareaId: string | number, cantidad: number, usarIa: boolean): Promise<number[]> {
  const tarea = await tareaSaboteable(tareaId);
  const objetivo = Math.min(Math.max(Math.floor(cantidad), 1), 10);

  // Sabotajes que ya existen para esta tarea (para no repetirlos)
  const existentes = new Set(((await query('SELECT hash FROM sabotajes WHERE tarea_original_id = $1', [tarea.id])) as any[]).map((f) => f.hash));

  const candidatos: Candidato[] = [];

  if (usarIa && iaDisponible()) {
    try {
      const ia = await generarSabotajeIA({ titulo: tarea.titulo, enunciado: tarea.descripcion, solucion: tarea.solucion });
      const d = diffLineas(tarea.solucion, ia.codigo);
      if (d.cambios >= 1 && d.cambios <= 3 && firmas(ia.codigo) === firmas(tarea.solucion)) {
        candidatos.push({
          codigo: ia.codigo, operador: 'ia', descripcion: ia.descripcion, linea: d.primeraLinea,
          lineasCambiadas: d.cambios, diff: d.diff, contexto: ia.contexto || null, origen: 'ia',
        });
      }
    } catch (error: any) {
      console.error('Sabotaje con IA descartado:', error.message);
    }
  }

  const semilla = existentes.size;
  const variantes = await mutarCodigo(tarea.solucion, Math.max(objetivo * 4, 12), semilla);
  for (const v of variantes) {
    candidatos.push({
      codigo: v.codigo, operador: v.operador, descripcion: v.descripcion, linea: v.linea,
      lineasCambiadas: v.lineas_cambiadas, diff: v.diff, contexto: null, origen: 'ast',
    });
  }

  const guardados: number[] = [];
  for (const [i, c] of candidatos.entries()) {
    if (guardados.length >= objetivo) break;
    const h = hash(c.codigo);
    if (existentes.has(h)) continue;

    const ev = await evaluarCodigo(tarea.id, c.codigo);
    if (!esSabotajeValido(ev)) continue;

    const [nuevo] = await query(
      `INSERT INTO sabotajes (tarea_original_id, codigo, hash, operador, descripcion, linea, lineas_cambiadas, diff,
                                     contexto, dificultad, tests_fallidos, tests_totales, origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (tarea_original_id, hash) DO NOTHING
       RETURNING id`,
      [tarea.id, c.codigo, h, c.operador, c.descripcion, c.linea, c.lineasCambiadas, c.diff,
       c.contexto || contextoPorDefecto(c.operador, semilla + i), calcularDificultad(ev),
       ev.fallidosVisibles + ev.fallidosOcultos, ev.total, c.origen]
    );
    if (nuevo) {
      guardados.push(nuevo.id);
      existentes.add(h);
    }
  }
  return guardados;
}

/** Crea la tarea jugable a partir de un sabotaje verificado. */
export async function publicarSabotaje(sabotajeId: string | number, contexto?: string | null): Promise<number> {
  const filas = await query(
    `SELECT s.*, t.categoria_id, t.nivel_id, t.titulo, t.descripcion, t.resultado_esperado, t.solucion, t.puntos_base
     FROM sabotajes s JOIN tareas t ON t.id = s.tarea_original_id WHERE s.id = $1`,
    [sabotajeId]
  ) as any[];
  const s = filas[0];
  if (!s) throw new Error('Sabotaje no encontrado');
  if (s.tarea_id) throw new Error('Este sabotaje ya está publicado');

  const contextoFinal = (contexto && contexto.trim()) || s.contexto;

  return transaction(async (conn) => {
    const [nueva] = await conn.query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion,
                           puntos_base, tipo, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sabotaje', $9)
       RETURNING id`,
      [s.categoria_id, s.nivel_id, `🕵️ Sabotaje: ${s.titulo}`, s.descripcion, s.codigo, s.resultado_esperado, s.solucion,
       s.puntos_base ?? null,
       JSON.stringify({ sabotajeId: s.id, tareaOriginalId: s.tarea_original_id, contexto: contextoFinal })]
    );
    const nuevaId: number = nueva.id;

    await conn.query(
      `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, entrada, salida_esperada, oculto, orden)
       SELECT $1, descripcion, codigo_test, entrada, salida_esperada, oculto, orden FROM tests_tarea WHERE tarea_id = $2`,
      [nuevaId, s.tarea_original_id]
    );
    await conn.query('UPDATE sabotajes SET tarea_id = $1, contexto = $2 WHERE id = $3', [nuevaId, contextoFinal, s.id]);
    return nuevaId;
  });
}

/** ¿Puede el usuario abrir esta tarea? Los sabotajes se desbloquean al completar la original. */
export async function puedeAbrirTarea(usuario: any, tarea: { id: any; tipo?: string; config?: any }): Promise<boolean> {
  if (tarea.tipo !== 'sabotaje') return true;
  if (usuario?.rol === 'admin') return true;
  if (!usuario) return false;
  const config = typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config || {};
  const filas = await query(
    'SELECT 1 FROM tareas_usuarios WHERE usuario_id = $1 AND tarea_id = $2',
    [usuario.id, config.tareaOriginalId]
  ) as any[];
  return filas.length > 0;
}

export async function sabotajePorTarea(tareaId: string | number) {
  const filas = await query('SELECT * FROM sabotajes WHERE tarea_id = $1', [tareaId]) as any[];
  return filas[0] || null;
}

// Para la insignia Cirujano: ¿arregló el sabotaje tocando como mucho las líneas que tocó el saboteador?
export const esArregloQuirurgico = (codigoSaboteado: string, codigoAlumno: string, lineasSaboteadas: number) =>
  diffLineas(codigoSaboteado, codigoAlumno).cambios <= lineasSaboteadas;
