import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.test' });

export default async function globalTeardown() {
  console.log('🧹 Iniciando limpieza global de pruebas de integración...');
  
  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    const testDbName = process.env.DB_NAME || 'astrocode_test';
    
    // Opción 1: Limpiar todas las tablas (recomendado para desarrollo)
    await cleanAllTables(connection, testDbName);
    
    // Opción 2: Eliminar completamente la base de datos (descomenta si prefieres esto)
    // await connection.execute(`DROP DATABASE IF EXISTS ${testDbName}`);
    // console.log(`🗑️ Base de datos de prueba '${testDbName}' eliminada`);
    
    await connection.end();
    
    console.log('✅ Limpieza global de pruebas completada');
  } catch (error) {
    console.error('❌ Error en limpieza global de pruebas:', error);
    // No lanzar el error para evitar que falle el proceso de pruebas
  }
}

async function cleanAllTables(connection: mysql.Connection, dbName: string) {
  try {
    await connection.execute(`USE ${dbName}`);
    
    // Desactivar verificaciones de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Obtener todas las tablas
    const [tables] = await connection.execute(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [dbName]
    ) as any;
    
    // Limpiar cada tabla
    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;
      await connection.execute(`TRUNCATE TABLE ${tableName}`);
      console.log(`🧹 Tabla '${tableName}' limpiada`);
    }
    
    // Reactivar verificaciones de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Todas las tablas de prueba han sido limpiadas');
  } catch (error) {
    console.error('❌ Error limpiando tablas:', error);
    throw error;
  }
}