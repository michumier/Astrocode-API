#!/usr/bin/env node

/**
 * Script de utilidad para ejecutar pruebas de integración de Astrocode
 * Proporciona una interfaz amigable para ejecutar diferentes tipos de pruebas
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para imprimir con colores
function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para mostrar el banner
function showBanner() {
  colorLog('\n' + '='.repeat(60), 'cyan');
  colorLog('🚀 ASTROCODE - PRUEBAS DE INTEGRACIÓN', 'bright');
  colorLog('='.repeat(60), 'cyan');
  colorLog('Sistema de pruebas automatizadas para la API de Astrocode\n', 'blue');
}

// Función para mostrar ayuda
function showHelp() {
  colorLog('📖 USO:', 'yellow');
  colorLog('  node run-tests.js [comando] [opciones]\n', 'bright');
  
  colorLog('📋 COMANDOS DISPONIBLES:', 'yellow');
  colorLog('  all              - Ejecutar todas las pruebas', 'green');
  colorLog('  user             - Pruebas de usuario (registro/login)', 'green');
  colorLog('  exercise         - Pruebas de ejecución de ejercicios', 'green');
  colorLog('  daily            - Pruebas de reto diario', 'green');
  colorLog('  ranking          - Pruebas de ranking/clasificación', 'green');
  colorLog('  resources        - Pruebas de recursos externos', 'green');
  colorLog('  coverage         - Ejecutar con reporte de cobertura', 'green');
  colorLog('  watch            - Ejecutar en modo watch', 'green');
  colorLog('  setup            - Configurar base de datos de prueba', 'green');
  colorLog('  teardown         - Limpiar base de datos de prueba', 'green');
  colorLog('  help             - Mostrar esta ayuda\n', 'green');
  
  colorLog('🔧 OPCIONES:', 'yellow');
  colorLog('  --verbose        - Salida detallada', 'blue');
  colorLog('  --debug          - Modo debug', 'blue');
  colorLog('  --bail           - Detener en el primer fallo', 'blue');
  colorLog('  --silent         - Salida mínima', 'blue');
  colorLog('  --force-exit     - Forzar salida al finalizar\n', 'blue');
  
  colorLog('💡 EJEMPLOS:', 'yellow');
  colorLog('  node run-tests.js all --verbose', 'magenta');
  colorLog('  node run-tests.js user --debug', 'magenta');
  colorLog('  node run-tests.js coverage --silent', 'magenta');
  colorLog('  node run-tests.js watch', 'magenta');
}

// Función para verificar prerrequisitos
function checkPrerequisites() {
  colorLog('🔍 Verificando prerrequisitos...', 'blue');
  
  // Verificar que existe package.json
  if (!fs.existsSync('./package.json')) {
    colorLog('❌ Error: No se encontró package.json en el directorio actual', 'red');
    colorLog('   Asegúrate de ejecutar este script desde test/integration/', 'yellow');
    process.exit(1);
  }
  
  // Verificar que existe .env.test
  if (!fs.existsSync('./.env.test')) {
    colorLog('⚠️  Advertencia: No se encontró .env.test', 'yellow');
    colorLog('   Se usarán las variables de entorno por defecto', 'yellow');
  }
  
  colorLog('✅ Prerrequisitos verificados\n', 'green');
}

// Función para ejecutar comando npm
function runNpmCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    colorLog(`🏃 Ejecutando: npm ${command} ${args.join(' ')}`, 'blue');
    
    const npmProcess = spawn('npm', [command, ...args], {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    npmProcess.on('close', (code) => {
      if (code === 0) {
        colorLog(`\n✅ Comando completado exitosamente`, 'green');
        resolve(code);
      } else {
        colorLog(`\n❌ Comando falló con código: ${code}`, 'red');
        reject(new Error(`Proceso terminó con código ${code}`));
      }
    });
    
    npmProcess.on('error', (error) => {
      colorLog(`❌ Error ejecutando comando: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = args.slice(1);
  
  showBanner();
  
  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  checkPrerequisites();
  
  try {
    switch (command) {
      case 'all':
        await runNpmCommand('test', options);
        break;
        
      case 'user':
        await runNpmCommand('run', ['test:user', ...options]);
        break;
        
      case 'exercise':
        await runNpmCommand('run', ['test:exercise', ...options]);
        break;
        
      case 'daily':
        await runNpmCommand('run', ['test:daily', ...options]);
        break;
        
      case 'ranking':
        await runNpmCommand('run', ['test:ranking', ...options]);
        break;
        
      case 'resources':
        await runNpmCommand('run', ['test:resources', ...options]);
        break;
        
      case 'coverage':
        await runNpmCommand('run', ['test:coverage', ...options]);
        break;
        
      case 'watch':
        await runNpmCommand('run', ['test:watch', ...options]);
        break;
        
      case 'setup':
        await runNpmCommand('run', ['setup-db', ...options]);
        break;
        
      case 'teardown':
        await runNpmCommand('run', ['teardown-db', ...options]);
        break;
        
      case 'debug':
        await runNpmCommand('run', ['test:debug', ...options]);
        break;
        
      case 'verbose':
        await runNpmCommand('run', ['test:verbose', ...options]);
        break;
        
      default:
        colorLog(`❌ Comando desconocido: ${command}`, 'red');
        colorLog('💡 Usa "node run-tests.js help" para ver los comandos disponibles\n', 'yellow');
        process.exit(1);
    }
    
    colorLog('\n🎉 ¡Proceso completado!', 'green');
    
  } catch (error) {
    colorLog(`\n💥 Error durante la ejecución: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Manejo de señales para limpieza
process.on('SIGINT', () => {
  colorLog('\n🛑 Proceso interrumpido por el usuario', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  colorLog('\n🛑 Proceso terminado', 'yellow');
  process.exit(0);
});

// Ejecutar función principal
if (require.main === module) {
  main().catch((error) => {
    colorLog(`💥 Error fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, runNpmCommand, colorLog };