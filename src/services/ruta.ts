import { query, transaction } from '../config/db';

/*
 * Ruta de aprendizaje (fase 11, docs/TEMARIO.md).
 *
 * - Cada planeta tiene sus pasos en orden. Dentro de un planeta, un paso se abre al completar los
 *   anteriores; los ya hechos siempre se pueden repetir.
 * - Un planeta se abre al conquistar el anterior (completar todos sus pasos). También está abierto
 *   si el alumno ya tiene algo hecho en él: así nadie encuentra un candado delante de lo que ya superó.
 * - Los admins y RUTA_CANDADOS=0 no tienen candados (en ese caso los pasos salen como «pendiente»).
 * - Las tareas que no están en la ruta (retos diarios, sabotajes, calibración) no se bloquean aquí.
 */

export type EstadoPaso = 'hecho' | 'siguiente' | 'pendiente' | 'bloqueado';
export type EstadoPlaneta = 'conquistado' | 'abierto' | 'bloqueado';

export interface PasoRuta {
  orden: number;
  // tarea | leccion
  tipo: string;
  tareaId: number | null;
  leccionId: number | null;
  estado: EstadoPaso;
}

export interface PlanetaRuta {
  clave: string;
  nombre: string;
  tema: string;
  orden: number;
  bonus: number;
  estado: EstadoPlaneta;
  pasos: PasoRuta[];
}

const conCandados = (usuario: any) => process.env.RUTA_CANDADOS !== '0' && usuario?.rol !== 'admin';

type PasoSinEstado = { planeta: string; orden: number; tipo: string; tareaId: number | null; leccionId?: number | null };

/**
 * Cálculo puro (se prueba en test/unit): estado de cada planeta y paso a partir de lo hecho.
 * `planetas` en orden y con sus pasos en orden. `hechas`: tareas completadas; `leidas`: lecciones completadas.
 */
export function calcularRuta(
  planetas: Omit<PlanetaRuta, 'estado' | 'pasos'>[],
  pasos: PasoSinEstado[],
  hechas: Set<number>,
  conquistados: Set<string>,
  candados: boolean,
  leidas: Set<number> = new Set(),
): PlanetaRuta[] {
  let anteriorConquistado = true;
  return planetas.map((p) => {
    const propios = pasos.filter((s) => s.planeta === p.clave);
    const hecho = (s: PasoSinEstado) =>
      (s.tareaId != null && hechas.has(s.tareaId)) || (s.leccionId != null && leidas.has(s.leccionId));
    const completo = propios.length > 0 && propios.every(hecho);
    const conquistado = conquistados.has(p.clave) || completo;
    const abierto = !candados || anteriorConquistado || propios.some(hecho);
    anteriorConquistado = conquistado;

    let siguienteVisto = false;
    const estados: PasoRuta[] = propios.map((s) => {
      let estado: EstadoPaso;
      if (hecho(s)) estado = 'hecho';
      else if (!abierto) estado = 'bloqueado';
      else if (!siguienteVisto) { estado = 'siguiente'; siguienteVisto = true; }
      else estado = candados ? 'bloqueado' : 'pendiente';
      return { orden: s.orden, tipo: s.tipo, tareaId: s.tareaId, leccionId: s.leccionId ?? null, estado };
    });

    return { ...p, estado: conquistado ? 'conquistado' : abierto ? 'abierto' : 'bloqueado', pasos: estados };
  });
}

export async function rutaDeUsuario(usuario: any): Promise<PlanetaRuta[]> {
  const [planetas, pasos, hechas, conquistados, leidas] = await Promise.all([
    query('SELECT clave, nombre, tema, orden, bonus FROM planetas ORDER BY orden'),
    query('SELECT planeta, orden, tipo, tarea_id, leccion_id FROM ruta_pasos ORDER BY planeta, orden'),
    usuario ? query('SELECT tarea_id FROM tareas_usuarios WHERE usuario_id = $1', [usuario.id]) : Promise.resolve([]),
    usuario ? query('SELECT planeta FROM planetas_conquistados WHERE usuario_id = $1', [usuario.id]) : Promise.resolve([]),
    usuario
      ? query('SELECT leccion_id FROM lecciones_usuarios WHERE usuario_id = $1 AND completada_el IS NOT NULL', [usuario.id])
      : Promise.resolve([]),
  ]);
  return calcularRuta(
    planetas,
    pasos.map((s) => ({ planeta: s.planeta, orden: s.orden, tipo: s.tipo, tareaId: s.tarea_id, leccionId: s.leccion_id })),
    new Set(hechas.map((f) => f.tarea_id)),
    new Set(conquistados.map((f) => f.planeta)),
    conCandados(usuario),
    new Set(leidas.map((f) => f.leccion_id)),
  );
}

// Un paso de la ruta: una tarea o una lección
export type RefPaso = { tareaId: number | string } | { leccionId: number | string };
const columnaDe = (paso: RefPaso): [string, number] =>
  'tareaId' in paso ? ['tarea_id', Number(paso.tareaId)] : ['leccion_id', Number(paso.leccionId)];

/** Por qué no puede abrir este paso de la ruta (null si puede o si no está en la ruta). */
export async function bloqueoDePaso(usuario: any, paso: RefPaso): Promise<string | null> {
  if (!conCandados(usuario)) return null;
  const [columna, id] = columnaDe(paso);
  const [fila] = await query(`SELECT planeta FROM ruta_pasos WHERE ${columna} = $1`, [id]);
  if (!fila) return null;

  const ruta = await rutaDeUsuario(usuario);
  const i = ruta.findIndex((p) => p.clave === fila.planeta);
  const planeta = ruta[i];
  const estado = planeta.pasos.find((s) => (columna === 'tarea_id' ? s.tareaId : s.leccionId) === id)?.estado;
  if (estado !== 'bloqueado') return null;
  if (planeta.estado === 'bloqueado') return `Conquista ${ruta[i - 1].nombre} para abrir ${planeta.nombre}`;
  return `Completa antes los pasos anteriores de ${planeta.nombre}`;
}

/**
 * Por qué no puede abrir esta tarea (null si puede). Junta los dos candados que hay:
 * el de los sabotajes (completar antes la tarea original) y el de la ruta.
 */
export async function bloqueoDeTarea(usuario: any, tarea: { id: any; tipo?: string; config?: any }): Promise<string | null> {
  if (tarea.tipo === 'sabotaje') {
    if (usuario?.rol === 'admin') return null;
    if (!usuario) return 'Completa primero el ejercicio original para desbloquear este sabotaje';
    const config = typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config || {};
    const original = await query('SELECT 1 FROM tareas_usuarios WHERE usuario_id = $1 AND tarea_id = $2', [usuario.id, config.tareaOriginalId]);
    return original.length ? null : 'Completa primero el ejercicio original para desbloquear este sabotaje';
  }

  return bloqueoDePaso(usuario, { tareaId: tarea.id });
}

/**
 * Tras completar un paso (tarea o lección): si con él el planeta queda completo y aún no estaba
 * conquistado, se apunta la conquista y se suma su bonus (una sola vez, aunque lleguen dos peticiones a la vez).
 */
export async function conquistarSiCompleto(usuarioId: number | string, ref: RefPaso) {
  const [columna, id] = columnaDe(ref);
  const [paso] = await query(`SELECT planeta FROM ruta_pasos WHERE ${columna} = $1`, [id]);
  if (!paso) return null;
  const [faltan] = await query(
    `SELECT COUNT(*) AS n FROM ruta_pasos r
     WHERE r.planeta = $1
       AND NOT EXISTS (SELECT 1 FROM tareas_usuarios tu WHERE tu.usuario_id = $2 AND tu.tarea_id = r.tarea_id)
       AND NOT EXISTS (SELECT 1 FROM lecciones_usuarios lu
                       WHERE lu.usuario_id = $2 AND lu.leccion_id = r.leccion_id AND lu.completada_el IS NOT NULL)`,
    [paso.planeta, usuarioId]
  );
  if (Number(faltan.n) > 0) return null;

  return transaction(async (conn) => {
    const [conquista] = await conn.query(
      `INSERT INTO planetas_conquistados (usuario_id, planeta, puntos)
       SELECT $1, clave, bonus FROM planetas WHERE clave = $2
       ON CONFLICT DO NOTHING
       RETURNING puntos`,
      [usuarioId, paso.planeta]
    );
    if (!conquista) return null;
    await conn.query('UPDATE usuarios SET puntos = COALESCE(puntos, 0) + $1 WHERE id = $2', [conquista.puntos, usuarioId]);
    const [planeta] = await conn.query('SELECT clave, nombre FROM planetas WHERE clave = $1', [paso.planeta]);
    return { clave: planeta.clave, nombre: planeta.nombre, puntos: conquista.puntos };
  });
}
