-- ================================
-- Modificación de la tabla tareas
-- Agregar columna titulo
-- ================================

-- Agregar columna titulo a la tabla tareas
ALTER TABLE tareas 
ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Título descriptivo del ejercicio';

-- Verificar que la columna se agregó correctamente
DESCRIBE tareas;

-- ================================================================
-- ACTUALIZAR TÍTULOS DE EJERCICIOS EXISTENTES
-- Basado en las categorías y niveles de dificultad
-- ================================================================

-- Variables y Tipos - Fácil
UPDATE tareas SET titulo = 'Variables Espaciales Básicas' WHERE categoria_id = 1 AND nivel_id = 1 AND id = 1;
UPDATE tareas SET titulo = 'Tipos de Datos Cósmicos' WHERE categoria_id = 1 AND nivel_id = 1 AND id = 2;
UPDATE tareas SET titulo = 'Constantes del Universo' WHERE categoria_id = 1 AND nivel_id = 1 AND id = 3;

-- Operadores - Fácil
UPDATE tareas SET titulo = 'Operaciones Matemáticas Galácticas' WHERE categoria_id = 2 AND nivel_id = 1 AND id = 4;
UPDATE tareas SET titulo = 'Comparaciones Estelares' WHERE categoria_id = 2 AND nivel_id = 1 AND id = 5;
UPDATE tareas SET titulo = 'Lógica Booleana Espacial' WHERE categoria_id = 2 AND nivel_id = 1 AND id = 6;

-- Estructuras Condicionales - Fácil
UPDATE tareas SET titulo = 'Decisiones de Navegación Espacial' WHERE categoria_id = 3 AND nivel_id = 1 AND id = 7;
UPDATE tareas SET titulo = 'Sistema de Alerta de Asteroides' WHERE categoria_id = 3 AND nivel_id = 1 AND id = 8;
UPDATE tareas SET titulo = 'Clasificador de Planetas' WHERE categoria_id = 3 AND nivel_id = 1 AND id = 9;

-- Bucles - Fácil
UPDATE tareas SET titulo = 'Cuenta Regresiva de Lanzamiento' WHERE categoria_id = 4 AND nivel_id = 1 AND id = 10;
UPDATE tareas SET titulo = 'Órbitas Planetarias' WHERE categoria_id = 4 AND nivel_id = 1 AND id = 11;
UPDATE tareas SET titulo = 'Exploración de Galaxias' WHERE categoria_id = 4 AND nivel_id = 1 AND id = 12;

-- Funciones - Fácil
UPDATE tareas SET titulo = 'Calculadora de Distancias Estelares' WHERE categoria_id = 5 AND nivel_id = 1 AND id = 13;
UPDATE tareas SET titulo = 'Convertidor de Unidades Espaciales' WHERE categoria_id = 5 AND nivel_id = 1 AND id = 14;
UPDATE tareas SET titulo = 'Generador de Coordenadas Galácticas' WHERE categoria_id = 5 AND nivel_id = 1 AND id = 15;

-- Arrays y Listas - Fácil
UPDATE tareas SET titulo = 'Inventario de Nave Espacial' WHERE categoria_id = 6 AND nivel_id = 1 AND id = 16;
UPDATE tareas SET titulo = 'Lista de Planetas Visitados' WHERE categoria_id = 6 AND nivel_id = 1 AND id = 17;
UPDATE tareas SET titulo = 'Catálogo de Estrellas' WHERE categoria_id = 6 AND nivel_id = 1 AND id = 18;

-- Objetos y Clases - Fácil
UPDATE tareas SET titulo = 'Clase Astronauta' WHERE categoria_id = 7 AND nivel_id = 1 AND id = 19;
UPDATE tareas SET titulo = 'Objeto Nave Espacial' WHERE categoria_id = 7 AND nivel_id = 1 AND id = 20;
UPDATE tareas SET titulo = 'Sistema Planetario' WHERE categoria_id = 7 AND nivel_id = 1 AND id = 21;

-- Algoritmos de Ordenamiento - Fácil
UPDATE tareas SET titulo = 'Ordenar Planetas por Distancia' WHERE categoria_id = 8 AND nivel_id = 1 AND id = 22;
UPDATE tareas SET titulo = 'Clasificar Asteroides por Tamaño' WHERE categoria_id = 8 AND nivel_id = 1 AND id = 23;
UPDATE tareas SET titulo = 'Organizar Misiones por Prioridad' WHERE categoria_id = 8 AND nivel_id = 1 AND id = 24;

-- Recursión - Fácil
UPDATE tareas SET titulo = 'Factorial de Años Luz' WHERE categoria_id = 9 AND nivel_id = 1 AND id = 25;
UPDATE tareas SET titulo = 'Secuencia de Fibonacci Cósmica' WHERE categoria_id = 9 AND nivel_id = 1 AND id = 26;
UPDATE tareas SET titulo = 'Torre de Hanoi Espacial' WHERE categoria_id = 9 AND nivel_id = 1 AND id = 27;

-- Estructuras de Datos - Fácil
UPDATE tareas SET titulo = 'Pila de Comandos de Nave' WHERE categoria_id = 10 AND nivel_id = 1 AND id = 28;
UPDATE tareas SET titulo = 'Cola de Despegue' WHERE categoria_id = 10 AND nivel_id = 1 AND id = 29;
UPDATE tareas SET titulo = 'Lista Enlazada de Satélites' WHERE categoria_id = 10 AND nivel_id = 1 AND id = 30;

-- Algoritmos Avanzados - Fácil
UPDATE tareas SET titulo = 'Búsqueda de Vida Extraterrestre' WHERE categoria_id = 11 AND nivel_id = 1 AND id = 31;

-- Programación Dinámica - Fácil
UPDATE tareas SET titulo = 'Optimización de Combustible' WHERE categoria_id = 12 AND nivel_id = 1 AND id = 34;

-- Títulos para ejercicios de nivel Intermedio
-- Variables y Tipos - Intermedio
UPDATE tareas SET titulo = 'Sistema de Tipos Avanzado Espacial' WHERE categoria_id = 1 AND nivel_id = 2;

-- Operadores - Intermedio
UPDATE tareas SET titulo = 'Calculadora Científica Galáctica' WHERE categoria_id = 2 AND nivel_id = 2;

-- Estructuras Condicionales - Intermedio
UPDATE tareas SET titulo = 'Sistema de Navegación Inteligente' WHERE categoria_id = 3 AND nivel_id = 2;

-- Bucles - Intermedio
UPDATE tareas SET titulo = 'Simulador de Órbitas Complejas' WHERE categoria_id = 4 AND nivel_id = 2;

-- Funciones - Intermedio
UPDATE tareas SET titulo = 'Biblioteca de Funciones Astronómicas' WHERE categoria_id = 5 AND nivel_id = 2;

-- Arrays y Listas - Intermedio
UPDATE tareas SET titulo = 'Matriz de Coordenadas Espaciales' WHERE categoria_id = 6 AND nivel_id = 2;

-- Objetos y Clases - Intermedio
UPDATE tareas SET titulo = 'Jerarquía de Vehículos Espaciales' WHERE categoria_id = 7 AND nivel_id = 2;

-- Algoritmos de Ordenamiento - Intermedio
UPDATE tareas SET titulo = 'Algoritmo de Ordenamiento Cósmico' WHERE categoria_id = 8 AND nivel_id = 2;

-- Recursión - Intermedio
UPDATE tareas SET titulo = 'Exploración Recursiva de Galaxias' WHERE categoria_id = 9 AND nivel_id = 2;

-- Estructuras de Datos - Intermedio
UPDATE tareas SET titulo = 'Árbol Binario de Sistemas Estelares' WHERE categoria_id = 10 AND nivel_id = 2;

-- Algoritmos Avanzados - Intermedio
UPDATE tareas SET titulo = 'Algoritmo de Pathfinding Espacial' WHERE categoria_id = 11 AND nivel_id = 2;

-- Programación Dinámica - Intermedio
UPDATE tareas SET titulo = 'Problema de la Mochila Espacial' WHERE categoria_id = 12 AND nivel_id = 2;

-- Títulos para ejercicios de nivel Difícil
-- Variables y Tipos - Difícil
UPDATE tareas SET titulo = 'Sistema de Tipos Genéricos Universales' WHERE categoria_id = 1 AND nivel_id = 3;

-- Operadores - Difícil
UPDATE tareas SET titulo = 'Sobrecarga de Operadores Cuánticos' WHERE categoria_id = 2 AND nivel_id = 3;

-- Estructuras Condicionales - Difícil
UPDATE tareas SET titulo = 'IA de Decisiones Espaciales' WHERE categoria_id = 3 AND nivel_id = 3;

-- Bucles - Difícil
UPDATE tareas SET titulo = 'Simulación de N-Cuerpos Gravitacionales' WHERE categoria_id = 4 AND nivel_id = 3;

-- Funciones - Difícil
UPDATE tareas SET titulo = 'Sistema de Funciones de Orden Superior' WHERE categoria_id = 5 AND nivel_id = 3;

-- Arrays y Listas - Difícil
UPDATE tareas SET titulo = 'Tensor Multidimensional Espacial' WHERE categoria_id = 6 AND nivel_id = 3;

-- Objetos y Clases - Difícil
UPDATE tareas SET titulo = 'Arquitectura de Microservicios Espaciales' WHERE categoria_id = 7 AND nivel_id = 3;

-- Algoritmos de Ordenamiento - Difícil
UPDATE tareas SET titulo = 'Algoritmo de Ordenamiento Cuántico' WHERE categoria_id = 8 AND nivel_id = 3;

-- Recursión - Difícil
UPDATE tareas SET titulo = 'Fractales del Espacio-Tiempo' WHERE categoria_id = 9 AND nivel_id = 3;

-- Estructuras de Datos - Difícil
UPDATE tareas SET titulo = 'Grafo de Redes Galácticas' WHERE categoria_id = 10 AND nivel_id = 3;

-- Algoritmos Avanzados - Difícil
UPDATE tareas SET titulo = 'Algoritmo de Machine Learning Cósmico' WHERE categoria_id = 11 AND nivel_id = 3;

-- Programación Dinámica - Difícil
UPDATE tareas SET titulo = 'Alineación de ADN Alienígena' WHERE categoria_id = 12 AND nivel_id = 3;

-- Verificar los cambios
SELECT id, categoria_id, nivel_id, titulo, LEFT(descripcion, 50) as descripcion_preview 
FROM tareas 
ORDER BY categoria_id, nivel_id, id;

console.log("\n✅ Columna 'titulo' agregada exitosamente a la tabla tareas");
console.log("📝 Títulos actualizados para todos los ejercicios con temática espacial");
console.log("🚀 Base de datos lista para usar los nuevos títulos");