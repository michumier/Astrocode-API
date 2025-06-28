import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function createConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  return connection;
}

export async function query(sql: string, params?: any[]) {
  const connection = await createConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}
