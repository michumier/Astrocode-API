import { readFileSync } from 'fs';
import path from 'path';
import { query, transaction, Conexion } from '../config/db';
import { testsRetosDiarios } from './seeds/retosDiarios';
import { misionesIniciales } from './seeds/misiones';
import { retosBomba, retosLengua, retosCamara, retosImpostor, retosNebulosa, retosRadio, retosColonia, RetoSemilla } from './seeds/retos';
import { ejerciciosRevisados, solucionArbolBinario } from './seeds/ejercicios';
import { retosDiariosNuevos } from './seeds/retosDiariosNuevos';

/*
 * Migraciones de la base de datos (Postgres desde la fase 8).
 *
 * La 001 crea el esquema completo (`esquema.sql`) y carga el catálogo original (`datos-base.sql`).
 * Las siguientes son las semillas que se fueron añadiendo con MySQL; conservan su número para
 * poder seguirles la pista en el historial. Para cambiar algo se añade una migración nueva AL FINAL
 * (nunca editar una ya aplicada). Se apuntan en `schema_migrations`.
 *
 * Cada migración va en su propia transacción: si falla, no deja nada a medias (en Postgres
 * también se deshacen los CREATE y ALTER). Se aplican al arrancar la API en local y con
 * `npm run migrar` en el despliegue.
 */
interface Migracion {
  id: string;
  sql?: string;
  run?: (conn: Conexion) => Promise<void>;
}

// Los .sql están junto a este archivo (en dist los copia `npm run build`)
const leerSql = (archivo: string) => readFileSync(path.join(__dirname, archivo), 'utf8');

// Tablas cuyos ids vienen fijados en los datos base: su contador sigue a partir del mayor
const TABLAS_CON_DATOS = ['categorias', 'niveles', 'tiempos_finalizacion', 'insignias', 'tareas'];

const migraciones: Migracion[] = [
  {
    id: '001_esquema',
    run: async (conn) => {
      await conn.query(leerSql('esquema.sql'));
      await conn.query(leerSql('datos-base.sql'));
      for (const tabla of TABLAS_CON_DATOS) {
        await conn.query(`SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), (SELECT max(id) FROM ${tabla}))`);
      }
    },
  },
  {
    // En los retos diarios, "resultado_esperado" contenía la SOLUCIÓN (se le mostraba al alumno
    // y además no se podía resolver comparando salidas). Se mueve a `solucion`, se pone un
    // ejemplo en su lugar y se añaden tests (algunos ocultos).
    id: '005_tests_retos_diarios',
    run: async (conn) => {
      for (const reto of testsRetosDiarios) {
        const tareas = await conn.query('SELECT id FROM tareas WHERE titulo = $1 ORDER BY id', [reto.titulo]);
        for (const { id } of tareas) {
          await conn.query(
            'UPDATE tareas SET solucion = resultado_esperado, resultado_esperado = $1 WHERE id = $2',
            [reto.ejemplo, id]
          );
          for (const [orden, test] of reto.tests.entries()) {
            await conn.query(
              `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, salida_esperada, oculto, orden)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [id, test.descripcion, test.codigo, test.salida, !!test.oculto, orden]
            );
          }
        }
      }
    },
  },
  {
    id: '011_insignia_cirujano',
    sql: `INSERT INTO insignias (nombre, descripcion, url_imagen)
          VALUES ('Cirujano', 'Arregló un sabotaje cambiando el mínimo de líneas posible.', 'https://img.icons8.com/color/96/scalpel.png')
          ON CONFLICT (nombre) DO NOTHING`,
  },
  {
    // Fase 2: las tres misiones de pilotaje iniciales
    id: '012_misiones_pilotaje',
    run: async (conn) => {
      for (const m of misionesIniciales) {
        const existe = await conn.query("SELECT id FROM tareas WHERE titulo = $1 AND tipo = 'pilotaje'", [m.titulo]);
        if (existe.length) continue;
        const cat = await conn.query('SELECT id FROM categorias WHERE nombre = $1', [m.categoria]);
        const niv = await conn.query('SELECT id FROM niveles WHERE nombre = $1', [m.nivel]);
        if (!cat.length || !niv.length) {
          console.warn(`Misión «${m.titulo}» omitida: no existe la categoría o el nivel`);
          continue;
        }
        await conn.query(
          `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pilotaje', $9)`,
          [cat[0].id, niv[0].id, m.titulo, m.descripcion, m.codigoBase, m.resultadoEsperado,
           m.solucion, m.puntos, JSON.stringify(m.config)]
        );
      }
    },
  },
  {
    // Fase 5.1: 💣 Bomba de cables (B1) y Bomba de módulos (B2)
    id: '013_retos_bomba',
    run: (conn) => sembrarRetos(conn, retosBomba),
  },
  {
    // Fase 5.2: 👽 El espejo (L1), La gravedad (L2) y Los lagos (L3)
    id: '014_retos_lengua',
    run: (conn) => sembrarRetos(conn, retosLengua),
  },
  {
    // Fase 5.3: 🔐 La huella del PIN (C1), La cámara de Ceres (C2) y La cerradura de combinación (C3)
    id: '015_retos_camara',
    run: (conn) => sembrarRetos(conn, retosCamara),
  },
  {
    // Fase 5.4: 🔍 Sabotaje en el reactor (I1) y El apagón (I2)
    id: '016_retos_impostor',
    run: (conn) => sembrarRetos(conn, retosImpostor),
  },
  {
    // Fase 5.5: 🎨 La bandera de Kepler (N1) y Los anillos de Saturno (N2)
    id: '017_retos_nebulosa',
    run: (conn) => sembrarRetos(conn, retosNebulosa),
  },
  {
    // Fase 5.6: 🎵 SOS (R1), El transmisor morse (R2) y La señal con ruido (R3)
    id: '018_retos_radio',
    run: (conn) => sembrarRetos(conn, retosRadio),
  },
  {
    // Fase 5.7: 🧬 Terraformación (Co1)
    id: '019_retos_colonia',
    run: (conn) => sembrarRetos(conn, retosColonia),
  },
  {
    // Fase 7: repaso de los 19 ejercicios de código (enunciado, código base, solución y tests)
    // y la solución del reto diario del árbol binario. Ver seeds/ejercicios.ts.
    id: '020_repaso_ejercicios',
    run: revisarEjercicios,
  },
  {
    // Fase 7: los 3 retos diarios estaban copiados 3 veces (el mismo reto daba puntos cada vez que
    // volvía). Se queda la copia más antigua de cada uno y se añaden 2 retos nuevos.
    id: '021_retos_diarios',
    run: async (conn) => {
      await quitarRetosDiariosRepetidos(conn);
      await sembrarRetosDiarios(conn);
    },
  },
];

// Antes de borrar una copia, su progreso pasa a la que se queda: completadas (si el alumno tenía las dos,
// cuenta una), intentos, pistas y sabotajes. Los puntos ya ganados no se tocan.
async function quitarRetosDiariosRepetidos(conn: Conexion) {
  const filas = await conn.query(
    `SELECT t.id, TRIM(t.titulo) AS titulo FROM tareas t JOIN categorias c ON t.categoria_id = c.id
     WHERE c.nombre = 'Reto Diario' AND t.tipo = 'codigo' ORDER BY t.id`
  );
  const primera = new Map<string, number>();
  for (const { id, titulo } of filas) {
    const queda = primera.get(titulo);
    if (queda === undefined) { primera.set(titulo, id); continue; }
    // (el antiguo UPDATE IGNORE: solo se mueven las filas que no chocan con una que ya existe)
    await conn.query(
      `UPDATE tareas_usuarios tu SET tarea_id = $1 WHERE tu.tarea_id = $2
         AND NOT EXISTS (SELECT 1 FROM tareas_usuarios o WHERE o.usuario_id = tu.usuario_id AND o.tarea_id = $1)`,
      [queda, id]
    );
    await conn.query('DELETE FROM tareas_usuarios WHERE tarea_id = $1', [id]);
    await conn.query('UPDATE intentos SET tarea_id = $1 WHERE tarea_id = $2', [queda, id]);
    await conn.query('UPDATE pistas_ia SET tarea_id = $1 WHERE tarea_id = $2', [queda, id]);
    await conn.query(
      `UPDATE sabotajes s SET tarea_original_id = $1 WHERE s.tarea_original_id = $2
         AND NOT EXISTS (SELECT 1 FROM sabotajes o WHERE o.tarea_original_id = $1 AND o.hash = s.hash)`,
      [queda, id]
    );
    await conn.query('DELETE FROM tareas WHERE id = $1', [id]);
    console.log(`Reto diario repetido ${id} («${titulo}») unido al ${queda}`);
  }
}

// Idempotente: no repite un reto que ya exista con el mismo título
async function sembrarRetosDiarios(conn: Conexion) {
  const cat = await conn.query("SELECT id FROM categorias WHERE nombre = 'Reto Diario'");
  const niv = await conn.query("SELECT id FROM niveles WHERE nombre = 'Reto Diario'");
  if (!cat.length || !niv.length) return;
  for (const r of retosDiariosNuevos) {
    const existe = await conn.query('SELECT id FROM tareas WHERE titulo = $1', [r.titulo]);
    if (existe.length) continue;
    const [nueva] = await conn.query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1000, 'codigo') RETURNING id`,
      [cat[0].id, niv[0].id, r.titulo, r.descripcion, r.codigoBase, r.resultadoEsperado, r.solucion]
    );
    for (const [orden, t] of r.tests.entries()) {
      await conn.query(
        `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, salida_esperada, oculto, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nueva.id, t.descripcion, t.codigo || null, t.salida, !!t.oculto, orden]
      );
    }
  }
}

// Solo toca cada ejercicio si sigue teniendo su título original: si alguien lo ha cambiado a mano
// desde el panel, se respeta y se avisa. Los tests solo se añaden si la tarea no tenía ninguno.
async function revisarEjercicios(conn: Conexion) {
  for (const e of ejerciciosRevisados) {
    const [actual] = await conn.query('SELECT titulo FROM tareas WHERE id = $1', [e.id]);
    if (!actual) continue;
    // Algunos títulos de la BD original llevan un salto de línea al final
    if (String(actual.titulo).trim() !== e.tituloAntes) {
      console.warn(`Ejercicio ${e.id} no revisado: su título ya no es «${e.tituloAntes}»`);
      continue;
    }
    const cat = await conn.query('SELECT id FROM categorias WHERE nombre = $1', [e.categoria]);
    await conn.query(
      `UPDATE tareas SET titulo = $1, descripcion = $2, codigo_base = $3, resultado_esperado = $4, solucion = $5,
         categoria_id = COALESCE($6, categoria_id)
       WHERE id = $7`,
      [e.titulo, e.descripcion, e.codigoBase, e.resultadoEsperado, e.solucion, cat[0]?.id ?? null, e.id]
    );
    const [tests] = await conn.query('SELECT COUNT(*) AS n FROM tests_tarea WHERE tarea_id = $1', [e.id]);
    if (Number(tests.n) > 0) continue;
    for (const [orden, t] of e.tests.entries()) {
      await conn.query(
        `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, salida_esperada, oculto, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [e.id, t.descripcion, t.codigo || null, t.salida, !!t.oculto, orden]
      );
    }
  }
  await conn.query(
    "UPDATE tareas SET solucion = $1 WHERE titulo = 'Invertir un Árbol Binario' AND solucion NOT LIKE '%class Nodo%'",
    [solucionArbolBinario]
  );
}

// Siembra retos de la fase 5 (idempotente: no repite los que ya existen por título)
async function sembrarRetos(conn: Conexion, retos: RetoSemilla[]) {
  for (const r of retos) {
    const existe = await conn.query("SELECT id FROM tareas WHERE titulo = $1 AND tipo = 'reto'", [r.titulo]);
    if (existe.length) continue;
    const cat = await conn.query('SELECT id FROM categorias WHERE nombre = $1', [r.categoria]);
    const niv = await conn.query('SELECT id FROM niveles WHERE nombre = $1', [r.nivel]);
    if (!cat.length || !niv.length) {
      console.warn(`Reto «${r.titulo}» omitido: no existe la categoría o el nivel`);
      continue;
    }
    await conn.query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'reto', $9)`,
      [cat[0].id, niv[0].id, r.titulo, r.descripcion, r.codigoBase, r.resultadoEsperado,
       r.solucion, r.puntos, JSON.stringify(r.config)]
    );
  }
}

// Retos de calibración del motor (fase 5.0). Solo con RETOS_DE_PRUEBA=1 (pruebas e2e y desarrollo):
// no son ejercicios para alumnos, sirven para probar argumentos, lotes y consultas de punta a punta.
export const retosDePrueba = [
  {
    titulo: '🧪 Calibración: argumentos',
    descripcion: 'Escribe calibrar(a, b), que devuelva la suma de los dos números.',
    codigoBase: 'def calibrar(a, b):\n    return 0\n',
    solucion: 'def calibrar(a, b):\n    return a + b\n',
    config: {
      mision: 'diagnostico', formato: 'diagnostico',
      escenarios: [
        { nombre: 'Pareja A', semilla: 1, params: { modo: 'args' } },
        { nombre: 'Pareja B', semilla: 2, params: { modo: 'args' } },
        { semilla: 3, params: { modo: 'args' }, oculto: true },
        { semilla: 4, params: { modo: 'args' }, oculto: true },
      ],
    },
  },
  {
    titulo: '🧪 Calibración: lotes',
    descripcion: 'Escribe calibrar(x, y), que devuelva (x + y) % 10. Se llama una vez por cada punto de la rejilla.',
    codigoBase: 'def calibrar(x, y):\n    return 0\n',
    solucion: 'def calibrar(x, y):\n    return (x + y) % 10\n',
    config: {
      mision: 'diagnostico', formato: 'diagnostico',
      escenarios: [
        { nombre: 'Rejilla 8×8', semilla: 1, params: { modo: 'lote', lado: 8 } },
        { nombre: 'Rejilla 48×48', semilla: 2, params: { modo: 'lote', lado: 48 } },
        { semilla: 3, params: { modo: 'lote', lado: 20 }, oculto: true },
      ],
    },
  },
  {
    titulo: '🧪 Calibración: consultas',
    descripcion: 'Escribe calibrar(sonda): acierta el número secreto con sonda.probar(n), que responde «mayor», «menor» o «abierta», antes de agotar sonda.intentos.',
    codigoBase: 'def calibrar(sonda):\n    sonda.probar(1)\n',
    solucion: `def calibrar(sonda):
    bajo, alto = sonda.minimo, sonda.maximo
    while bajo <= alto:
        medio = (bajo + alto) // 2
        r = sonda.probar(medio)
        if r == "abierta":
            return medio
        if r == "mayor":
            bajo = medio + 1
        else:
            alto = medio - 1
`,
    config: {
      mision: 'diagnostico', formato: 'diagnostico',
      escenarios: [
        { nombre: 'Rango de mil', semilla: 1, params: { modo: 'consulta', maximo: 1000 } },
        { nombre: 'Rango de un millón', semilla: 2, params: { modo: 'consulta', maximo: 1000000 } },
        { semilla: 3, params: { modo: 'consulta', maximo: 1000000000 }, oculto: true },
        { semilla: 4, params: { modo: 'consulta', maximo: 50 }, oculto: true },
      ],
    },
  },
];

export async function sembrarRetosDePrueba() {
  if (process.env.RETOS_DE_PRUEBA !== '1') return;
  const cat = await query("SELECT id FROM categorias WHERE nombre = 'Funciones'");
  const niv = await query("SELECT id FROM niveles WHERE nombre = 'Fácil'");
  if (!cat.length || !niv.length) return;
  for (const r of retosDePrueba) {
    const existe = await query("SELECT id FROM tareas WHERE titulo = $1 AND tipo = 'reto'", [r.titulo]);
    if (existe.length) continue;
    await query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 10, 'reto', $8)`,
      [cat[0].id, niv[0].id, r.titulo, r.descripcion, r.codigoBase,
       'Superar todos los escenarios (algunos ocultos).', r.solucion, JSON.stringify(r.config)]
    );
  }
  console.log('Retos de calibración (RETOS_DE_PRUEBA=1) listos');
}

// Días que se guardan los intentos (privacidad). Se limpian al arrancar la API.
const RETENCION_INTENTOS_DIAS = Number(process.env.RETENCION_INTENTOS_DIAS || 180);

export async function limpiarIntentosAntiguos() {
  await query("DELETE FROM intentos WHERE creado_el < now() - make_interval(days => $1)", [RETENCION_INTENTOS_DIAS]);
}

// Número cualquiera, pero fijo: con este candado, dos arranques a la vez no aplican la misma migración
const CANDADO_MIGRACIONES = 20261030;

export async function aplicarMigraciones() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(100) PRIMARY KEY,
      aplicada_el TIMESTAMPTZ DEFAULT now()
    )
  `);
  await query('ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY');

  for (const migracion of migraciones) {
    await transaction(async (conn) => {
      await conn.query('SELECT pg_advisory_xact_lock($1)', [CANDADO_MIGRACIONES]);
      const aplicada = await conn.query('SELECT 1 FROM schema_migrations WHERE id = $1', [migracion.id]);
      if (aplicada.length) return;
      console.log(`Aplicando migración ${migracion.id}...`);
      if (migracion.sql) await conn.query(migracion.sql);
      if (migracion.run) await migracion.run(conn);
      await conn.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migracion.id]);
    });
  }
}

// Da rol admin a los emails de ADMIN_EMAILS (separados por comas) en el .env
export const emailsAdmin = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function sincronizarAdmins() {
  const emails = emailsAdmin();
  if (emails.length === 0) return;

  await query("UPDATE usuarios SET rol = 'admin' WHERE lower(correo_electronico) = ANY($1)", [emails]);
}
