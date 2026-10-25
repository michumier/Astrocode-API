import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Un único pool para toda la aplicación (antes se abría una conexión por query)
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 10,
  waitForConnections: true,
  multipleStatements: true,
});

export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Ejecuta varias queries en una transacción: si algo falla, no se guarda nada
export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Comprueba que la BD responde (reintenta mientras MySQL arranca en Docker)
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
