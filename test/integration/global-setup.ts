import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('🚀 Iniciando configuración global de pruebas de integración...');
  
  try {
    // Configurar base de datos de prueba
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    // Crear base de datos de prueba si no existe
    const testDbName = process.env.DB_NAME || 'astrocode_test';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${testDbName}`);
    await connection.execute(`USE ${testDbName}`);
    
    console.log(`✅ Base de datos de prueba '${testDbName}' configurada`);

    // Crear tablas necesarias para las pruebas
    await createTestTables(connection);
    
    await connection.end();
    
    console.log('✅ Configuración global de pruebas completada');
  } catch (error) {
    console.error('❌ Error en configuración global de pruebas:', error);
    throw error;
  }
}

async function createTestTables(connection: mysql.Connection) {
  console.log('📋 Creando tablas de prueba...');
  
  try {
    // Tabla usuarios
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
        correo_electronico VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        nombre_completo VARCHAR(100),
        puntos INT DEFAULT 0,
        creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla categorias
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    
    // Tabla niveles
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS niveles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        puntos INT NOT NULL
      )
    `);
    
    // Tabla tareas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tareas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoria_id INT,
        nivel_id INT,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        fecha_vencimiento DATE,
        prioridad INT DEFAULT 1,
        completado BOOLEAN DEFAULT FALSE,
        tiempo_finalizacion_id INT,
        puntos_base INT DEFAULT 0,
        puntos_bonus INT DEFAULT 0,
        codigo_base TEXT,
        resultado_esperado TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (nivel_id) REFERENCES niveles(id)
      )
    `);
    
    // Tabla progreso_usuario (para tracking de ejercicios completados)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS progreso_usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        tarea_id INT,
        completado BOOLEAN DEFAULT FALSE,
        puntos_obtenidos INT DEFAULT 0,
        fecha_completado TIMESTAMP NULL,
        codigo_solucion TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (tarea_id) REFERENCES tareas(id),
        UNIQUE KEY unique_user_task (usuario_id, tarea_id)
      )
    `);
    
    // Tabla retos_diarios (para pruebas de retos)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS retos_diarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        puntos_recompensa INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla recursos_externos (para pruebas de recursos)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recursos_externos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        url VARCHAR(500) NOT NULL,
        tipo VARCHAR(50),
        activo BOOLEAN DEFAULT TRUE,
        clicks INT DEFAULT 0,
        creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla clicks_recursos (para tracking de clicks)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clicks_recursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        recurso_id INT,
        fecha_click TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (recurso_id) REFERENCES recursos_externos(id)
      )
    `);
    
    console.log('✅ Tablas de prueba creadas exitosamente');
    
    // Insertar datos de prueba básicos
    await insertTestData(connection);
    
  } catch (error) {
    console.error('❌ Error creando tablas de prueba:', error);
    throw error;
  }
}

async function insertTestData(connection: mysql.Connection) {
  console.log('📝 Insertando datos de prueba básicos...');
  
  try {
    // Insertar categorías de prueba
    await connection.execute(`
      INSERT IGNORE INTO categorias (nombre) VALUES 
      ('Básico'), ('Intermedio'), ('Avanzado'), ('Algoritmos')
    `);
    
    // Insertar niveles de prueba
    await connection.execute(`
      INSERT IGNORE INTO niveles (nombre, puntos) VALUES 
      ('Principiante', 10),
      ('Intermedio', 20),
      ('Avanzado', 30),
      ('Experto', 50)
    `);
    
    // Insertar algunas tareas de prueba
    await connection.execute(`
      INSERT IGNORE INTO tareas (categoria_id, nivel_id, titulo, descripcion, puntos_base, codigo_base, resultado_esperado) VALUES 
      (1, 1, 'Hola Mundo', 'Imprime "Hello, World!"', 10, 'print("Hello, World!")', 'Hello, World!'),
      (1, 1, 'Suma Simple', 'Suma dos números', 15, 'a = 5\nb = 3\nprint(a + b)', '8'),
      (2, 2, 'Bucle For', 'Imprime números del 1 al 5', 20, 'for i in range(1, 6):\n    print(i)', '1\n2\n3\n4\n5')
    `);
    
    // Insertar recursos externos de prueba
    await connection.execute(`
      INSERT IGNORE INTO recursos_externos (titulo, descripcion, url, tipo) VALUES 
      ('Documentación Python', 'Documentación oficial de Python', 'https://docs.python.org/3/', 'documentacion'),
      ('Tutorial Python', 'Tutorial interactivo de Python', 'https://www.learnpython.org/', 'tutorial'),
      ('Ejercicios Python', 'Ejercicios prácticos de Python', 'https://www.w3schools.com/python/', 'ejercicios')
    `);
    
    console.log('✅ Datos de prueba básicos insertados');
  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
    throw error;
  }
}