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
  tipo: string;
  tareaId: number | null;
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

/**
 * Cálculo puro (se prueba en test/unit): estado de cada planeta y paso a partir de lo hecho.
 * `planetas` en orden y con sus pasos en orden.
 */
export function calcularRuta(
  planetas: Omit<PlanetaRuta, 'estado' | 'pasos'>[],
  pasos: { planeta: string; orden: number; tipo: string; tareaId: number | null }[],
  hechas: Set<number>,
  conquistados: Set<string>,
  candados: boolean,
): PlanetaRuta[] {
  let anteriorConquistado = true;
  return planetas.map((p) => {
    const propios = pasos.filter((s) => s.planeta === p.clave);
    const hecho = (s: { tareaId: number | null }) => s.tareaId !== null && hechas.has(s.tareaId);
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
      return { orden: s.orden, tipo: s.tipo, tareaId: s.tareaId, estado };
    });

    return { ...p, estado: conquistado ? 'conquistado' : abierto ? 'abierto' : 'bloqueado', pasos: estados };
  });
}

export async function rutaDeUsuario(usuario: any): Promise<PlanetaRuta[]> {
  const [planetas, pasos, hechas, conquistados] = await Promise.all([
    query('SELECT clave, nombre, tema, orden, bonus FROM planetas ORDER BY orden'),
    query('SELECT planeta, orden, tipo, tarea_id FROM ruta_pasos ORDER BY planeta, orden'),
    usuario ? query('SELECT tarea_id FROM tareas_usuarios WHERE usuario_id = $1', [usuario.id]) : Promise.resolve([]),
    usuario ? query('SELECT planeta FROM planetas_conquistados WHERE usuario_id = $1', [usuario.id]) : Promise.resolve([]),
  ]);
  return calcularRuta(
    planetas,
    pasos.map((s) => ({ planeta: s.planeta, orden: s.orden, tipo: s.tipo, tareaId: s.tarea_id })),
    new Set(hechas.map((f) => f.tarea_id)),
    new Set(conquistados.map((f) => f.planeta)),
    conCandados(usuario),
  );
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

  if (!conCandados(usuario)) return null;
  const [paso] = await query('SELECT planeta FROM ruta_pasos WHERE tarea_id = $1', [tarea.id]);
  if (!paso) return null;

  const ruta = await rutaDeUsuario(usuario);
  const i = ruta.findIndex((p) => p.clave === paso.planeta);
  const planeta = ruta[i];
  const estado = planeta.pasos.find((s) => s.tareaId === Number(tarea.id))?.estado;
  if (estado !== 'bloqueado') return null;
  if (planeta.estado === 'bloqueado') return `Conquista ${ruta[i - 1].nombre} para abrir ${planeta.nombre}`;
  return `Completa antes los pasos anteriores de ${planeta.nombre}`;
}

/**
 * Tras completar una tarea: si con ella el planeta queda completo y aún no estaba conquistado, se
 * apunta la conquista y se suma su bonus (una sola vez, aunque lleguen dos peticiones a la vez).
 */
export async function conquistarSiCompleto(usuarioId: number | string, tareaId: number | string) {
  const [paso] = await query('SELECT planeta FROM ruta_pasos WHERE tarea_id = $1', [tareaId]);
  if (!paso) return null;
  const [faltan] = await query(
    `SELECT COUNT(*) AS n FROM ruta_pasos r
     WHERE r.planeta = $1
       AND NOT EXISTS (SELECT 1 FROM tareas_usuarios tu WHERE tu.usuario_id = $2 AND tu.tarea_id = r.tarea_id)`,
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
