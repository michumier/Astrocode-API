import { Pool, PoolClient, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Postgres devuelve BIGINT (ids y COUNT) y NUMERIC (SUM) como texto para no perder precisión.
// En AstroCode nunca pasan de 2^53, así que se leen como número, igual que hacía mysql2.
types.setTypeParser(types.builtins.INT8, (v) => parseInt(v, 10));
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));
// Las fechas sin hora se quedan como 'AAAA-MM-DD' (como Date se movían según la zona horaria)
types.setTypeParser(types.builtins.DATE, (v) => v);

// En la nube (Supabase) se usa DATABASE_URL; en local, las variables DB_* del .env.
// DB_POOL_MAX: en funciones serverless conviene pocas conexiones por instancia.
const maximo = parseInt(process.env.DB_POOL_MAX || '10');

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: maximo,
    })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '5432'),
      max: maximo,
    });

// Las consultas usan los parámetros de Postgres: $1, $2…
export interface Conexion {
  // Filas que devuelve la consulta (en INSERT/UPDATE, las del RETURNING)
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  // Número de filas afectadas
  ejecutar(sql: string, params?: any[]): Promise<number>;
}

const conexion = (cliente: Pool | PoolClient): Conexion => ({
  query: async (sql, params) => (await cliente.query(sql, params)).rows,
  ejecutar: async (sql, params) => (await cliente.query(sql, params)).rowCount ?? 0,
});

const general = conexion(pool);
export const query = general.query;
export const ejecutar = general.ejecutar;

// Ejecuta varias queries en una transacción: si algo falla, no se guarda nada
export async function transaction<T>(fn: (conn: Conexion) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const result = await fn(conexion(cliente));
    await cliente.query('COMMIT');
    return result;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Violación de una clave única (p. ej. la misma tarea completada dos veces)
export const esDuplicado = (error: any) => error?.code === '23505';

// Hoy y el comienzo de hoy en UTC (los retos diarios y el límite de pistas cambian a medianoche UTC)
export const HOY_UTC = "(now() AT TIME ZONE 'utc')::date";
export const INICIO_DIA_UTC = "(date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc')";

// Comprueba que la BD responde (reintenta mientras Postgres arranca en Docker)
export async function waitForDatabase(intentos = 20, esperaMs = 3000) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (i === intentos) throw error;
      console.log(`Esperando a la base de datos (${i}/${intentos})...`);
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
}
