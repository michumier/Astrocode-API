import { pool } from '../config/db';

/*
 * Migraciones de la base de datos.
 *
 * `BD Astrocode.sql` solo se ejecuta cuando el volumen de MySQL está vacío
 * (docker-entrypoint-initdb.d). Para cambiar el esquema de una BD que ya existe
 * se añade aquí una migración nueva AL FINAL de la lista (nunca editar una ya aplicada).
 * Al arrancar, la API aplica las que falten y las apunta en `schema_migrations`.
 */
const migraciones: { id: string; sql: string }[] = [
  {
    id: '001_rol_usuarios',
    sql: "ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'alumno'",
  },
  {
    // Los resolvers de categorías ya usaban esta columna, pero no existía en la BD
    id: '002_descripcion_categorias',
    sql: 'ALTER TABLE categorias ADD COLUMN descripcion TEXT NULL',
  },
];

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
    await pool.query(migracion.sql);
    await pool.query('INSERT INTO schema_migrations (id) VALUES (?)', [migracion.id]);
  }
}

// Da rol admin a los emails de ADMIN_EMAILS (separados por comas) en el .env
export async function sincronizarAdmins() {
  const emails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (emails.length === 0) return;

  await pool.query(
    `UPDATE usuarios SET rol = 'admin' WHERE correo_electronico IN (${emails.map(() => '?').join(',')})`,
    emails
  );
}
