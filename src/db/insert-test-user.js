const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function insertTestUser() {
  try {
    console.log('Conectando a la base de datos...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('Conexión exitosa!');

    // Hashear la contraseña
    const password = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario de prueba
    const [result] = await connection.execute(
      `INSERT INTO usuarios (nombre_usuario, correo_electronico, contrasena_hash, nombre_completo, puntos) 
       VALUES (?, ?, ?, ?, ?)`,
      ['testuser', 'test@example.com', hashedPassword, 'Usuario de Prueba', 0]
    );

    console.log('Usuario de prueba creado exitosamente!');
    console.log('Credenciales:');
    console.log('Email: test@example.com');
    console.log('Contraseña: password123');
    console.log('ID del usuario:', result.insertId);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nVerifica que:');
      console.log('1. MySQL esté ejecutándose');
      console.log('2. Las credenciales en .env sean correctas');
      console.log('3. La base de datos "astrocodebd" exista');
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('\nEl usuario de prueba ya existe en la base de datos.');
    }
  }
}

insertTestUser();