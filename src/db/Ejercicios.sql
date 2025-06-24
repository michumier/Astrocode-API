-- ================================================================
-- SCRIPT DE INSERCIÓN DE EJERCICIOS PARA ASTROCODE
-- ================================================================
-- Este script inserta ejercicios de ejemplo para cada categoría y nivel
-- Basado en la estructura de la base de datos y los ejercicios del Dashboard

USE astrocodebd;

-- ================================================================
-- 1. INSERTAR CATEGORÍAS
-- ================================================================

INSERT IGNORE INTO categorias (nombre) VALUES 
('Variables y Tipos'),
('Operadores'),
('Estructuras Condicionales'),
('Bucles'),
('Funciones'),
('Arrays y Listas'),
('Objetos y Clases'),
('Algoritmos de Ordenamiento'),
('Recursión'),
('Estructuras de Datos'),
('Algoritmos Avanzados'),
('Programación Dinámica'),
('Grafos y Árboles'),
('Optimización'),
('Algoritmos de Búsqueda');

-- ================================================================
-- 2. INSERTAR NIVELES
-- ================================================================

INSERT IGNORE INTO niveles (nombre, puntos) VALUES 
('Fácil', 50),
('Intermedio', 200),
('Difícil', 500);

-- ================================================================
-- 3. INSERTAR TIEMPOS DE FINALIZACIÓN
-- ================================================================

INSERT IGNORE INTO tiempos_finalizacion (umbral, puntos_bonus) VALUES 
('00:02:00', 10),  -- 2 minutos - bonus bajo
('00:05:00', 25),  -- 5 minutos - bonus medio
('00:10:00', 50),  -- 10 minutos - bonus alto
('00:15:00', 75),  -- 15 minutos - bonus muy alto
('00:30:00', 100); -- 30 minutos - bonus máximo

-- ================================================================
-- 4. INSERTAR EJERCICIOS POR CATEGORÍA Y NIVEL
-- ================================================================

-- Variables para almacenar IDs
SET @facil_id = (SELECT id FROM niveles WHERE nombre = 'Fácil');
SET @intermedio_id = (SELECT id FROM niveles WHERE nombre = 'Intermedio');
SET @dificil_id = (SELECT id FROM niveles WHERE nombre = 'Difícil');

-- Tiempo de finalización IDs
SET @tiempo_2min = (SELECT id FROM tiempos_finalizacion WHERE umbral = '00:02:00');
SET @tiempo_5min = (SELECT id FROM tiempos_finalizacion WHERE umbral = '00:05:00');
SET @tiempo_10min = (SELECT id FROM tiempos_finalizacion WHERE umbral = '00:10:00');
SET @tiempo_15min = (SELECT id FROM tiempos_finalizacion WHERE umbral = '00:15:00');
SET @tiempo_30min = (SELECT id FROM tiempos_finalizacion WHERE umbral = '00:30:00');

-- ================================================================
-- CATEGORÍA: Variables y Tipos
-- ================================================================

SET @cat_variables = (SELECT id FROM categorias WHERE nombre = 'Variables y Tipos');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_variables, @facil_id, 
'Declara una variable llamada "edad" de tipo entero y asígnale el valor 25. Luego imprime su valor en la consola.',
3, @tiempo_2min, 50, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_variables, @intermedio_id, 
'Crea un programa que declare variables de diferentes tipos (entero, flotante, string, booleano) y realice conversiones entre ellos. Muestra los resultados de cada conversión.',
3, @tiempo_5min, 200, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_variables, @dificil_id, 
'Implementa un sistema de tipos dinámicos que pueda detectar automáticamente el tipo de una variable y realizar operaciones seguras entre diferentes tipos.',
4, @tiempo_15min, 500, 0);

-- ================================================================
-- CATEGORÍA: Operadores
-- ================================================================

SET @cat_operadores = (SELECT id FROM categorias WHERE nombre = 'Operadores');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_operadores, @facil_id, 
'Crea un programa que use operadores aritméticos (+, -, *, /, %) para realizar cálculos básicos con dos números ingresados por el usuario.',
3, @tiempo_2min, 75, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_operadores, @intermedio_id, 
'Implementa una calculadora que maneje operadores lógicos y de comparación. Debe evaluar expresiones complejas con paréntesis.',
3, @tiempo_10min, 250, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_operadores, @dificil_id, 
'Crea un intérprete de expresiones matemáticas que pueda evaluar operadores personalizados y funciones definidas por el usuario.',
4, @tiempo_30min, 600, 0);

-- ================================================================
-- CATEGORÍA: Estructuras Condicionales
-- ================================================================

SET @cat_condicionales = (SELECT id FROM categorias WHERE nombre = 'Estructuras Condicionales');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_condicionales, @facil_id, 
'Escribe un programa que determine si un número es positivo, negativo o cero usando estructuras if-else.',
3, @tiempo_2min, 100, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_condicionales, @intermedio_id, 
'Crea un sistema de calificaciones que asigne letras (A, B, C, D, F) basado en puntuaciones numéricas usando switch-case o if-else anidados.',
3, @tiempo_5min, 300, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_condicionales, @dificil_id, 
'Implementa un sistema de reglas de negocio complejo que evalúe múltiples condiciones anidadas para determinar elegibilidad de préstamos bancarios.',
4, @tiempo_15min, 700, 0);

-- ================================================================
-- CATEGORÍA: Bucles
-- ================================================================

SET @cat_bucles = (SELECT id FROM categorias WHERE nombre = 'Bucles');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_bucles, @facil_id, 
'Usa un bucle for para imprimir los números del 1 al 10. Luego modifica el programa para imprimir solo los números pares.',
3, @tiempo_2min, 125, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_bucles, @intermedio_id, 
'Crea un programa que genere la secuencia de Fibonacci hasta el n-ésimo término usando diferentes tipos de bucles (for, while, do-while).',
3, @tiempo_10min, 350, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_bucles, @dificil_id, 
'Implementa un algoritmo de optimización que use bucles anidados para resolver el problema del viajante de comercio con fuerza bruta.',
5, @tiempo_30min, 800, 0);

-- ================================================================
-- CATEGORÍA: Funciones
-- ================================================================

SET @cat_funciones = (SELECT id FROM categorias WHERE nombre = 'Funciones');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_funciones, @facil_id, 
'Crea una función que calcule el área de un círculo dado su radio. La función debe recibir el radio como parámetro y retornar el área.',
3, @tiempo_2min, 150, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_funciones, @intermedio_id, 
'Implementa un conjunto de funciones matemáticas (factorial, potencia, raíz cuadrada) que se puedan componer entre sí.',
3, @tiempo_10min, 400, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_funciones, @dificil_id, 
'Crea un sistema de funciones de orden superior que implemente map, filter, reduce y permita el encadenamiento de operaciones.',
5, @tiempo_30min, 900, 0);

-- ================================================================
-- CATEGORÍA: Arrays y Listas
-- ================================================================

SET @cat_arrays = (SELECT id FROM categorias WHERE nombre = 'Arrays y Listas');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_arrays, @facil_id, 
'Crea un array de 5 números enteros, encuentra el mayor y el menor, y calcula el promedio de todos los elementos.',
3, @tiempo_5min, 200, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_arrays, @intermedio_id, 
'Implementa funciones para manipular arrays: insertar, eliminar, buscar elementos y rotar el array hacia la izquierda o derecha.',
3, @tiempo_10min, 250, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_arrays, @dificil_id, 
'Crea una implementación eficiente de un array dinámico que se redimensione automáticamente y mantenga un factor de carga óptimo.',
4, @tiempo_30min, 500, 0);

-- ================================================================
-- CATEGORÍA: Objetos y Clases
-- ================================================================

SET @cat_objetos = (SELECT id FROM categorias WHERE nombre = 'Objetos y Clases');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_objetos, @facil_id, 
'Define una clase "Persona" con propiedades nombre, edad y métodos para saludar y cumplir años. Crea instancias y prueba los métodos.',
3, @tiempo_5min, 250, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_objetos, @intermedio_id, 
'Implementa un sistema de herencia con clases Vehículo, Auto y Motocicleta. Incluye métodos abstractos y polimorfismo.',
3, @tiempo_15min, 250, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_objetos, @dificil_id, 
'Crea un sistema de diseño de patrones que implemente Factory, Observer y Strategy patterns en un proyecto cohesivo.',
5, @tiempo_30min, 600, 0);

-- ================================================================
-- CATEGORÍA: Algoritmos de Ordenamiento
-- ================================================================

SET @cat_ordenamiento = (SELECT id FROM categorias WHERE nombre = 'Algoritmos de Ordenamiento');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_ordenamiento, @facil_id, 
'Implementa el algoritmo de ordenamiento burbuja para ordenar un array de números enteros de menor a mayor.',
3, @tiempo_5min, 300, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_ordenamiento, @intermedio_id, 
'Implementa y compara los algoritmos quicksort y mergesort. Mide y analiza su rendimiento con diferentes tamaños de datos.',
4, @tiempo_15min, 300, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_ordenamiento, @dificil_id, 
'Crea un algoritmo de ordenamiento híbrido que combine múltiples técnicas y se adapte automáticamente según las características de los datos.',
5, @tiempo_30min, 700, 0);

-- ================================================================
-- CATEGORÍA: Recursión
-- ================================================================

SET @cat_recursion = (SELECT id FROM categorias WHERE nombre = 'Recursión');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_recursion, @facil_id, 
'Implementa una función recursiva para calcular el factorial de un número. Incluye casos base y manejo de errores.',
3, @tiempo_5min, 350, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_recursion, @intermedio_id, 
'Crea funciones recursivas para recorrer y manipular estructuras de datos como árboles binarios (inserción, búsqueda, eliminación).',
4, @tiempo_15min, 350, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_recursion, @dificil_id, 
'Implementa un solucionador de laberintos usando backtracking recursivo con optimizaciones de memoización.',
5, @tiempo_30min, 800, 0);

-- ================================================================
-- CATEGORÍA: Estructuras de Datos
-- ================================================================

SET @cat_estructuras = (SELECT id FROM categorias WHERE nombre = 'Estructuras de Datos');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_estructuras, @facil_id, 
'Implementa una pila (stack) con operaciones push, pop, peek y isEmpty. Úsala para verificar paréntesis balanceados.',
3, @tiempo_10min, 400, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_estructuras, @intermedio_id, 
'Crea una implementación completa de una lista enlazada con operaciones de inserción, eliminación y búsqueda eficientes.',
4, @tiempo_15min, 400, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_estructuras, @dificil_id, 
'Implementa un árbol AVL auto-balanceado con todas las operaciones de rotación y mantenimiento del factor de balance.',
5, @tiempo_30min, 900, 0);

-- ================================================================
-- CATEGORÍA: Algoritmos Avanzados
-- ================================================================

SET @cat_avanzados = (SELECT id FROM categorias WHERE nombre = 'Algoritmos Avanzados');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_avanzados, @facil_id, 
'Implementa el algoritmo de búsqueda binaria en un array ordenado. Compara su eficiencia con la búsqueda lineal.',
4, @tiempo_10min, 500, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_avanzados, @intermedio_id, 
'Crea una implementación del algoritmo de Dijkstra para encontrar el camino más corto en un grafo ponderado.',
4, @tiempo_30min, 500, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_avanzados, @dificil_id, 
'Implementa un algoritmo de machine learning básico (regresión lineal) desde cero sin usar librerías externas.',
5, @tiempo_30min, 500, 0);

-- ================================================================
-- CATEGORÍA: Programación Dinámica
-- ================================================================

SET @cat_dinamica = (SELECT id FROM categorias WHERE nombre = 'Programación Dinámica');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_dinamica, @facil_id, 
'Resuelve el problema de Fibonacci usando programación dinámica con memoización. Compara con la versión recursiva naive.',
4, @tiempo_10min, 600, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_dinamica, @intermedio_id, 
'Implementa la solución al problema de la mochila (knapsack) usando programación dinámica con optimización de espacio.',
4, @tiempo_30min, 600, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_dinamica, @dificil_id, 
'Resuelve el problema de la subsecuencia común más larga (LCS) entre múltiples cadenas usando programación dinámica 3D.',
5, @tiempo_30min, 600, 0);

-- ================================================================
-- CATEGORÍA: Grafos y Árboles
-- ================================================================

SET @cat_grafos = (SELECT id FROM categorias WHERE nombre = 'Grafos y Árboles');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_grafos, @facil_id, 
'Implementa los algoritmos de recorrido DFS y BFS para un grafo representado con lista de adyacencia.',
4, @tiempo_15min, 700, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_grafos, @intermedio_id, 
'Crea un algoritmo para detectar ciclos en un grafo dirigido y otro para encontrar componentes fuertemente conexas.',
4, @tiempo_30min, 700, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_grafos, @dificil_id, 
'Implementa el algoritmo de Ford-Fulkerson para encontrar el flujo máximo en una red de flujo.',
5, @tiempo_30min, 700, 0);

-- ================================================================
-- CATEGORÍA: Optimización
-- ================================================================

SET @cat_optimizacion = (SELECT id FROM categorias WHERE nombre = 'Optimización');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_optimizacion, @facil_id, 
'Optimiza un algoritmo de búsqueda lineal implementando técnicas de early termination y cache-friendly access patterns.',
4, @tiempo_15min, 800, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_optimizacion, @intermedio_id, 
'Implementa un algoritmo genético para resolver el problema de optimización de funciones multimodales.',
5, @tiempo_30min, 800, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_optimizacion, @dificil_id, 
'Crea un optimizador de consultas SQL básico que pueda reordenar joins y seleccionar índices óptimos.',
5, @tiempo_30min, 800, 0);

-- ================================================================
-- CATEGORÍA: Algoritmos de Búsqueda
-- ================================================================

SET @cat_busqueda = (SELECT id FROM categorias WHERE nombre = 'Algoritmos de Búsqueda');

-- Ejercicio Fácil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_busqueda, @facil_id, 
'Implementa una búsqueda A* simple para encontrar el camino más corto en una cuadrícula 2D con obstáculos.',
4, @tiempo_15min, 900, 0);

-- Ejercicio Intermedio
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_busqueda, @intermedio_id, 
'Crea un motor de búsqueda de texto que implemente algoritmos de matching de patrones como KMP y Rabin-Karp.',
5, @tiempo_30min, 900, 0);

-- Ejercicio Difícil
INSERT INTO tareas (categoria_id, nivel_id, descripcion, prioridad, tiempo_finalizacion_id, puntos_base, puntos_bonus)
VALUES (@cat_busqueda, @dificil_id, 
'Implementa un sistema de búsqueda distribuida que pueda indexar y buscar en múltiples nodos de manera eficiente.',
5, @tiempo_30min, 900, 0);

-- ================================================================
-- 5. VERIFICACIÓN DE DATOS INSERTADOS
-- ================================================================

-- Mostrar resumen de ejercicios por categoría y nivel
SELECT 
    c.nombre AS categoria,
    n.nombre AS nivel,
    COUNT(*) AS total_ejercicios,
    AVG(t.puntos_base) AS promedio_puntos
FROM tareas t
JOIN categorias c ON t.categoria_id = c.id
JOIN niveles n ON t.nivel_id = n.id
GROUP BY c.nombre, n.nombre
ORDER BY c.nombre, n.puntos;

-- Mostrar total de ejercicios insertados
SELECT 
    COUNT(*) AS total_ejercicios_insertados,
    COUNT(DISTINCT categoria_id) AS categorias_con_ejercicios,
    COUNT(DISTINCT nivel_id) AS niveles_con_ejercicios
FROM tareas;

COMMIT;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================