const axios = require('axios');

// Configuración
const PYTHON_RUNNER_URL = 'http://localhost:5000';

// Función para probar el health check
async function testHealthCheck() {
    console.log('🔍 Probando health check...');
    try {
        const response = await axios.get(`${PYTHON_RUNNER_URL}/health`);
        console.log('✅ Health check exitoso:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Error en health check:', error.message);
        return false;
    }
}

// Función para probar ejecución de código Python
async function testPythonExecution() {
    console.log('\n🐍 Probando ejecución de código Python...');
    
    const testCases = [
        {
            name: 'Hola Mundo',
            code: 'print("¡Hola desde Python!")',
            expected: '¡Hola desde Python!'
        },
        {
            name: 'Operaciones matemáticas',
            code: 'print(2 + 3)\nprint(10 * 5)',
            expected: '5\n50'
        },
        {
            name: 'Variables y strings',
            code: 'nombre = "Astrocode"\nprint(f"Bienvenido a {nombre}")',
            expected: 'Bienvenido a Astrocode'
        },
        {
            name: 'Bucles',
            code: 'for i in range(3):\n    print(f"Iteración {i}")',
            expected: 'Iteración 0\nIteración 1\nIteración 2'
        },
        {
            name: 'Error de sintaxis (debe fallar)',
            code: 'print("sin cerrar comillas',
            shouldFail: true
        }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
        console.log(`\n📝 Ejecutando: ${testCase.name}`);
        console.log(`Código: ${testCase.code}`);
        
        try {
            const response = await axios.post(`${PYTHON_RUNNER_URL}/run`, {
                code: testCase.code
            });
            
            const result = response.data;
            console.log(`Salida: "${result.stdout.trim()}"`);
            console.log(`Errores: "${result.stderr.trim()}"`);
            console.log(`Código de salida: ${result.exit_code}`);
            
            if (testCase.shouldFail) {
                if (result.exit_code !== 0) {
                    console.log('✅ Test pasado (error esperado)');
                    passed++;
                } else {
                    console.log('❌ Test fallido (se esperaba error)');
                }
            } else {
                if (result.exit_code === 0 && result.stdout.trim() === testCase.expected) {
                    console.log('✅ Test pasado');
                    passed++;
                } else {
                    console.log(`❌ Test fallido. Esperado: "${testCase.expected}"`);
                }
            }
            
        } catch (error) {
            console.log('❌ Error en la petición:', error.message);
        }
    }
    
    console.log(`\n📊 Resultados: ${passed}/${total} tests pasados`);
    return passed === total;
}

// Función principal
async function main() {
    console.log('🚀 Iniciando pruebas del Python Runner...');
    console.log(`🔗 URL: ${PYTHON_RUNNER_URL}`);
    
    // Probar health check
    const healthOk = await testHealthCheck();
    
    if (!healthOk) {
        console.log('\n❌ El servicio no está disponible. Verifica que Docker esté ejecutándose.');
        console.log('💡 Ejecuta: docker-compose up --build');
        return;
    }
    
    // Probar ejecución de código
    const testsOk = await testPythonExecution();
    
    if (testsOk) {
        console.log('\n🎉 ¡Todas las pruebas pasaron! El Python Runner está funcionando correctamente.');
    } else {
        console.log('\n⚠️ Algunas pruebas fallaron. Revisa la configuración.');
    }
}

// Ejecutar las pruebas
main().catch(console.error);