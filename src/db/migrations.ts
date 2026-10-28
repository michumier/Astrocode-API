import { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/db';
import { testsRetosDiarios } from './seeds/retosDiarios';
import { misionesIniciales } from './seeds/misiones';
import { retosBomba, retosLengua, retosCamara, retosImpostor, RetoSemilla } from './seeds/retos';

/*
 * Migraciones de la base de datos.
 *
 * `BD Astrocode.sql` solo se ejecuta cuando el volumen de MySQL está vacío
 * (docker-entrypoint-initdb.d). Para cambiar el esquema de una BD que ya existe
 * se añade aquí una migración nueva AL FINAL de la lista (nunca editar una ya aplicada).
 * Al arrancar, la API aplica las que falten y las apunta en `schema_migrations`.
 */
interface Migracion {
  id: string;
  sql?: string;
  run?: (conn: PoolConnection) => Promise<void>;
}

const migraciones: Migracion[] = [
  {
    id: '001_rol_usuarios',
    sql: "ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'alumno'",
  },
  {
    // Los resolvers de categorías ya usaban esta columna, pero no existía en la BD
    id: '002_descripcion_categorias',
    sql: 'ALTER TABLE categorias ADD COLUMN descripcion TEXT NULL',
  },
  {
    // Tests que se ejecutan contra el código del alumno. Los ocultos no se le enseñan.
    id: '003_tests_tarea',
    sql: `CREATE TABLE tests_tarea (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tarea_id BIGINT NOT NULL,
      descripcion VARCHAR(255) NOT NULL DEFAULT '',
      codigo_test TEXT NULL COMMENT 'Código que se añade tras el del alumno (llamadas + print)',
      entrada TEXT NULL COMMENT 'stdin para el programa',
      salida_esperada TEXT NOT NULL,
      oculto TINYINT(1) NOT NULL DEFAULT 0,
      orden INT NOT NULL DEFAULT 0,
      KEY tarea_id (tarea_id),
      CONSTRAINT tests_tarea_ibfk_1 FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  },
  {
    // Solución de referencia: solo la ve el servidor (y la IA para dar pistas), nunca el alumno
    id: '004_solucion_tareas',
    sql: 'ALTER TABLE tareas ADD COLUMN solucion TEXT NULL',
  },
  {
    // En los retos diarios, "resultado_esperado" contenía la SOLUCIÓN (se le mostraba al alumno
    // y además no se podía resolver comparando salidas). Se mueve a `solucion`, se pone un
    // ejemplo en su lugar y se añaden tests (algunos ocultos).
    id: '005_tests_retos_diarios',
    run: async (conn) => {
      for (const reto of testsRetosDiarios) {
        const [tareas] = await conn.query('SELECT id FROM tareas WHERE titulo = ?', [reto.titulo]) as any[];
        for (const { id } of tareas as any[]) {
          await conn.query(
            'UPDATE tareas SET solucion = resultado_esperado, resultado_esperado = ? WHERE id = ?',
            [reto.ejemplo, id]
          );
          for (const [orden, test] of reto.tests.entries()) {
            await conn.query(
              `INSERT INTO tests_tarea (tarea_id, descripcion, codigo_test, salida_esperada, oculto, orden)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [id, test.descripcion, test.codigo, test.salida, test.oculto ? 1 : 0, orden]
            );
          }
        }
      }
    },
  },
  {
    // Registro de pistas pedidas a la IA (para limitar cuántas pide cada alumno)
    id: '006_pistas_ia',
    sql: `CREATE TABLE pistas_ia (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      usuario_id BIGINT NOT NULL,
      tarea_id BIGINT NOT NULL,
      creado_el TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      KEY usuario_fecha (usuario_id, creado_el),
      CONSTRAINT pistas_ia_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
      CONSTRAINT pistas_ia_ibfk_2 FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  },
  {
    // Igual que en categorías: los resolvers de niveles pedían esta columna y la query fallaba siempre
    id: '007_descripcion_niveles',
    sql: 'ALTER TABLE niveles ADD COLUMN descripcion TEXT NULL',
  },
  {
    // Cada envío de solución (para el puente de mando y la repetición de intentos)
    id: '008_intentos',
    sql: `CREATE TABLE intentos (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      usuario_id BIGINT NOT NULL,
      tarea_id BIGINT NOT NULL,
      codigo MEDIUMTEXT NOT NULL,
      correcto TINYINT(1) NOT NULL,
      tests_superados INT NULL,
      tests_totales INT NULL,
      tipo_error VARCHAR(50) NULL,
      segundos_en_tarea INT NULL,
      creado_el TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      KEY tarea_fecha (tarea_id, creado_el),
      KEY usuario_fecha (usuario_id, creado_el),
      CONSTRAINT intentos_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
      CONSTRAINT intentos_ibfk_2 FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  },
  {
    // Tipos de tarea: 'codigo' (las de siempre), 'sabotaje' y 'pilotaje' (fases 1 y 2)
    id: '009_tipo_config_tareas',
    sql: "ALTER TABLE tareas ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'codigo', ADD COLUMN config JSON NULL",
  },
  {
    // Fase 1: sabotajes generados (y verificados) a partir de la solución de una tarea
    id: '010_sabotajes',
    sql: `CREATE TABLE sabotajes (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tarea_original_id BIGINT NOT NULL,
      tarea_id BIGINT NULL COMMENT 'Tarea tipo sabotaje creada al publicarlo',
      codigo MEDIUMTEXT NOT NULL,
      hash CHAR(64) NOT NULL,
      operador VARCHAR(30) NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      linea INT NULL,
      lineas_cambiadas INT NOT NULL,
      diff TEXT NOT NULL,
      contexto TEXT NULL,
      dificultad VARCHAR(10) NOT NULL,
      tests_fallidos INT NOT NULL,
      tests_totales INT NOT NULL,
      origen VARCHAR(10) NOT NULL DEFAULT 'ast',
      creado_el TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY original_hash (tarea_original_id, hash),
      CONSTRAINT sabotajes_ibfk_1 FOREIGN KEY (tarea_original_id) REFERENCES tareas (id) ON DELETE CASCADE,
      CONSTRAINT sabotajes_ibfk_2 FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  },
  {
    id: '011_insignia_cirujano',
    sql: `INSERT IGNORE INTO insignias (nombre, descripcion, url_imagen)
          VALUES ('Cirujano', 'Arregló un sabotaje cambiando el mínimo de líneas posible.', 'https://img.icons8.com/color/96/scalpel.png')`,
  },
  {
    // Fase 2: las tres misiones de pilotaje iniciales
    id: '012_misiones_pilotaje',
    run: async (conn) => {
      for (const m of misionesIniciales) {
        const [existe] = await conn.query("SELECT id FROM tareas WHERE titulo = ? AND tipo = 'pilotaje'", [m.titulo]) as any[];
        if ((existe as any[]).length) continue;
        const [cat] = await conn.query('SELECT id FROM categorias WHERE nombre = ?', [m.categoria]) as any[];
        const [niv] = await conn.query('SELECT id FROM niveles WHERE nombre = ?', [m.nivel]) as any[];
        if (!(cat as any[]).length || !(niv as any[]).length) {
          console.warn(`Misión «${m.titulo}» omitida: no existe la categoría o el nivel`);
          continue;
        }
        await conn.query(
          `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pilotaje', ?)`,
          [(cat as any[])[0].id, (niv as any[])[0].id, m.titulo, m.descripcion, m.codigoBase, m.resultadoEsperado,
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
];

// Siembra retos de la fase 5 (idempotente: no repite los que ya existen por título)
async function sembrarRetos(conn: any, retos: RetoSemilla[]) {
  for (const r of retos) {
    const [existe] = await conn.query("SELECT id FROM tareas WHERE titulo = ? AND tipo = 'reto'", [r.titulo]) as any[];
    if ((existe as any[]).length) continue;
    const [cat] = await conn.query('SELECT id FROM categorias WHERE nombre = ?', [r.categoria]) as any[];
    const [niv] = await conn.query('SELECT id FROM niveles WHERE nombre = ?', [r.nivel]) as any[];
    if (!(cat as any[]).length || !(niv as any[]).length) {
      console.warn(`Reto «${r.titulo}» omitido: no existe la categoría o el nivel`);
      continue;
    }
    await conn.query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reto', ?)`,
      [(cat as any[])[0].id, (niv as any[])[0].id, r.titulo, r.descripcion, r.codigoBase, r.resultadoEsperado,
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
  const [cat] = await pool.query("SELECT id FROM categorias WHERE nombre = 'Funciones'") as any[];
  const [niv] = await pool.query("SELECT id FROM niveles WHERE nombre = 'Fácil'") as any[];
  if (!(cat as any[]).length || !(niv as any[]).length) return;
  for (const r of retosDePrueba) {
    const [existe] = await pool.query("SELECT id FROM tareas WHERE titulo = ? AND tipo = 'reto'", [r.titulo]) as any[];
    if ((existe as any[]).length) continue;
    await pool.query(
      `INSERT INTO tareas (categoria_id, nivel_id, titulo, descripcion, codigo_base, resultado_esperado, solucion, puntos_base, tipo, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, 10, 'reto', ?)`,
      [(cat as any[])[0].id, (niv as any[])[0].id, r.titulo, r.descripcion, r.codigoBase,
       'Superar todos los escenarios (algunos ocultos).', r.solucion, JSON.stringify(r.config)]
    );
  }
  console.log('Retos de calibración (RETOS_DE_PRUEBA=1) listos');
}

// Días que se guardan los intentos (privacidad). Se limpian al arrancar la API.
const RETENCION_INTENTOS_DIAS = Number(process.env.RETENCION_INTENTOS_DIAS || 180);

export async function limpiarIntentosAntiguos() {
  await pool.query('DELETE FROM intentos WHERE creado_el < NOW() - INTERVAL ? DAY', [RETENCION_INTENTOS_DIAS]);
}

export async function aplicarMigraciones() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(100) PRIMARY KEY,
      aplicada_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [filas] = await pool.query('SELECT id FROM schema_migrations') as any[];
  const aplicadas = new Set((filas as any[]).map((f) => f.id));

  for (const migracion of migraciones) {
    if (aplicadas.has(migracion.id)) continue;
    console.log(`Aplicando migración ${migracion.id}...`);
    const conn = await pool.getConnection();
    try {
      if (migracion.sql) await conn.query(migracion.sql);
      if (migracion.run) await migracion.run(conn);
      await conn.query('INSERT INTO schema_migrations (id) VALUES (?)', [migracion.id]);
    } finally {
      conn.release();
    }
  }
}

// Da rol admin a los emails de ADMIN_EMAILS (separados por comas) en el .env
export const emailsAdmin = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

export async function sincronizarAdmins() {
  const emails = emailsAdmin();
  if (emails.length === 0) return;

  await pool.query(
    `UPDATE usuarios SET rol = 'admin' WHERE correo_electronico IN (${emails.map(() => '?').join(',')})`,
    emails
  );
}
