-- Datos base de AstroCode (fase 8), convertidos del antiguo volcado de MySQL («BD Astrocode.sql»).
-- Solo el catálogo: categorías, niveles, tiempos, insignias y los 28 ejercicios originales. Los usuarios
-- y su progreso del volcado no se traen. Lo aplica la migración 001_esquema; el resto de ejercicios y
-- retos los siembran las migraciones siguientes.

-- categorias: 16 filas
INSERT INTO categorias (id, nombre) VALUES (11, 'Algoritmos Avanzados');
INSERT INTO categorias (id, nombre) VALUES (15, 'Algoritmos de Búsqueda');
INSERT INTO categorias (id, nombre) VALUES (8, 'Algoritmos de Ordenamiento');
INSERT INTO categorias (id, nombre) VALUES (6, 'Arrays y Listas');
INSERT INTO categorias (id, nombre) VALUES (4, 'Bucles');
INSERT INTO categorias (id, nombre) VALUES (3, 'Estructuras Condicionales');
INSERT INTO categorias (id, nombre) VALUES (10, 'Estructuras de Datos');
INSERT INTO categorias (id, nombre) VALUES (5, 'Funciones');
INSERT INTO categorias (id, nombre) VALUES (13, 'Grafos y Árboles');
INSERT INTO categorias (id, nombre) VALUES (7, 'Objetos y Clases');
INSERT INTO categorias (id, nombre) VALUES (2, 'Operadores');
INSERT INTO categorias (id, nombre) VALUES (14, 'Optimización');
INSERT INTO categorias (id, nombre) VALUES (12, 'Programación Dinámica');
INSERT INTO categorias (id, nombre) VALUES (9, 'Recursión');
INSERT INTO categorias (id, nombre) VALUES (16, 'Reto Diario');
INSERT INTO categorias (id, nombre) VALUES (1, 'Variables y Tipos');

-- niveles: 4 filas
INSERT INTO niveles (id, nombre, puntos) VALUES (1, 'Fácil', 50);
INSERT INTO niveles (id, nombre, puntos) VALUES (2, 'Intermedio', 100);
INSERT INTO niveles (id, nombre, puntos) VALUES (3, 'Difícil', 250);
INSERT INTO niveles (id, nombre, puntos) VALUES (4, 'Reto Diario', 500);

-- tiempos_finalizacion: 5 filas
INSERT INTO tiempos_finalizacion (id, umbral, puntos_bonus) VALUES (1, '00:02:00', 100);
INSERT INTO tiempos_finalizacion (id, umbral, puntos_bonus) VALUES (2, '00:05:00', 75);
INSERT INTO tiempos_finalizacion (id, umbral, puntos_bonus) VALUES (3, '00:10:00', 50);
INSERT INTO tiempos_finalizacion (id, umbral, puntos_bonus) VALUES (4, '00:15:00', 25);
INSERT INTO tiempos_finalizacion (id, umbral, puntos_bonus) VALUES (5, '00:30:00', 10);

-- insignias: 7 filas
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (1, 'Primer Despegue', 'Completó su primer ejercicio en la plataforma.', 'https://img.icons8.com/color/96/rocket--v1.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (2, 'Explorador Constante', 'Ha completado 5 ejercicios de nivel Fácil.', 'https://img.icons8.com/color/96/planet.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (3, 'Desafío Superado', 'Ha completado un ejercicio de nivel Difícil.', 'https://img.icons8.com/color/96/medal2--v1.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (4, 'Velocidad de la Luz', 'Completó un ejercicio en menos de 30 segundos.', 'https://img.icons8.com/color/96/flash-on--v1.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (5, 'Maestro de la Misión', 'Completó todos los ejercicios de una categoría.', 'https://img.icons8.com/color/96/galaxy.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (6, 'Reto Diario', 'Completó un reto diario en el mismo día.', 'https://img.icons8.com/color/96/calendar-3.png');
INSERT INTO insignias (id, nombre, descripcion, url_imagen) VALUES (7, 'Beta Tester', 'Formó parte del equipo de pruebas inicial.', 'https://img.icons8.com/color/96/test-account.png');

-- tareas: 28 filas
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (1, 1, 1, 'Misión: Configuración de Nave Espacial

Como nuevo cadete de AstroCode, tu primera misión es configurar los sistemas básicos de tu nave espacial. Debes declarar una variable para almacenar la edad del comandante.

Contexto de la misión:
Estás a bordo de la estación espacial AstroCode-1, preparándote para tu primer viaje intergaláctico. El sistema de navegación requiere que registres la edad del comandante para calcular los parámetros de vuelo.

**Objetivos:**
- Declara una variable llamada "edad" de tipo entero
- Asígnale el valor 25
- Imprime su valor en la consola con un mensaje espacial

¡Completa esta configuración para poder despegar hacia las estrellas!', NULL, 3, false, 1, 50, 50, 'print("? === REGISTRO DE COMANDANTE ESPACIAL ===")

# TODO: Declara la variable edad y asígnale el valor 25

# TODO: Imprime el valor con un mensaje
print(f"Edad del comandante: {edad} años terrestres")
print("✅ Comandante registrado - Listo para el despegue!")', '? === REGISTRO DE COMANDANTE ESPACIAL ===
Edad del comandante: 25 años terrestres
✅ Comandante registrado - Listo para el despegue!', 'Variables Espaciales Básicas');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (2, 1, 2, 'Misión: Sistema de Telemetría Avanzada

Como ingeniero de sistemas de la estación AstroCode, debes crear un programa de telemetría que maneje diferentes tipos de datos de la nave y realice conversiones entre ellos.

Contexto de la misión:
Los sensores de la nave envían datos en diferentes formatos. Tu sistema debe procesar y convertir estos datos para que sean compatibles con el ordenador central.

Objetivos:
- Declara variables de diferentes tipos (entero, flotante, string, booleano)
- Realiza conversiones entre tipos
- Muestra los resultados de cada conversión

Datos de sensores:
- Velocidad: "2500" (string) → convertir a número
- Temperatura: 98.6 (float) → convertir a entero
- Coordenada X: 42 (int) → convertir a string
- Sistema activo: 1 (int) → convertir a booleano

¡La precisión de los datos es crucial para la navegación!', NULL, 3, false, 2, 100, 50, 'print("? === LABORATORIO DE TIPOS CUÁNTICOS ===")

# Sistema de detección automática de tipos
class DetectorTipos:
    # TODO: Implementar detección automática de tipos
    @staticmethod
    def detectar_tipo(muestra):
        # Implementar lógica de detección
        pass
    
    # TODO: Implementar conversiones seguras
    @staticmethod
    def convertir_seguro(valor, tipo_destino):
        # Implementar conversiones con validación
        pass
    
    # TODO: Implementar operaciones entre tipos
    @staticmethod
    def operar_tipos(valor1, valor2, operacion):
        # Implementar operaciones seguras
        pass

# Muestras de prueba
muestras = [42, "Helio-3", 3.14159, True, None, {"elemento": "Hidrógeno"}]

print("? Analizando muestras extraterrestres:")
for index, muestra in enumerate(muestras):
    # TODO: Usar DetectorTipos para analizar cada muestra
    print(f"Muestra {index + 1}: {muestra} -> Tipo: [IMPLEMENTAR]")

print("
? Pruebas de conversión segura:")
# TODO: Implementar pruebas de conversión

print("
⚗️ Análisis completado")', '?️ === SISTEMA DE TELEMETRÍA ESPACIAL ===
? Datos originales:
Velocidad (string): 2500
Temperatura (float): 98.6
Coordenada X (int): 42
Sistema activo (int): 1

? Datos convertidos:
Velocidad (number): 2500 km/h
Temperatura (int): 98°C
Coordenada X (string): "42"
Sistema activo (boolean): true

✅ Telemetría procesada correctamente!', 'Sistema de Tipos Avanzado Espacial');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (3, 1, 3, 'Como astrónomo en AstroCode, tienes una lista con las distancias (en millones de kilómetros) a varios planetas del sistema solar. Debes ordenar la lista de menor a mayor distancia, pero hay un requisito especial:
Los planetas con distancias múltiplos de 3 deben aparecer al principio, ordenados ascendentemente.
Luego, el resto de planetas también ordenados ascendentemente.

Objetivos del ejercicio:

Dada una lista distancias con números enteros.
Crear una función ordenar_distancias(distancias) que:
Separe los números múltiplos de 3 y los demás.
Ordene ambos grupos por separado de menor a mayor.
Devuelva una lista con los múltiplos de 3 primero, luego el resto.
Imprimir la lista ordenada resultante.

Queremos que se vea así:
Ordenación especial de distancias planetarias

[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]

NOTA: para imprimir el array, únicamente debes hacer print(nombre_array)', NULL, 4, false, 4, 500, 150, 'print("Ordenación especial de distancias planetarias\n")

distancias = [58, 108, 149, 227, 384, 778, 1430, 2870, 4500]

def ordenar_distancias(distancias):
    # TODO: Separar múltiplos de 3 y otros
    # TODO: Ordenar ambas listas
    # TODO: Unir y devolver resultado
    pass

distancias_ordenadas = ordenar_distancias(distancias)
print(distancias_ordenadas)
', 'Ordenación especial de distancias planetarias

[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]
', 'Ordenar las distancias de planetas');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (4, 2, 1, 'Misión: Calculadora de Combustible Espacial

Como técnico de combustible en la estación AstroCode, debes crear un programa que calcule el consumo de combustible para diferentes maniobras espaciales.

Contexto de la misión:
La nave necesita realizar cálculos precisos de combustible antes de cada maniobra. Tu calculadora debe usar operadores aritméticos para determinar el combustible necesario.

Objetivos:
- Usa operadores aritméticos (+, -, *, /, %) 
- Calcula combustible para aceleración, frenado y maniobras
- Muestra los resultados de cada operación

Datos de entrada:
- Combustible inicial: 1000 litros
- Consumo por aceleración: 150 litros
- Consumo por frenado: 75 litros

⛽ ¡Cada gota de combustible cuenta en el espacio!', NULL, 3, false, 1, 50, 50, 'print("? === INTÉRPRETE DE COMANDOS GALÁCTICOS ===")

# Intérprete de expresiones espaciales
class InterpreteGalactico:
    def __init__(self):
        self.operadores = {}
        self.funciones = {}
        self.inicializar_operadores()
    
    # TODO: Inicializar operadores personalizados
    def inicializar_operadores(self):
        # Implementar operadores espaciales
        pass
    
    # TODO: Registrar función personalizada
    def registrar_funcion(self, nombre, funcion):
        # Implementar registro de funciones
        pass
    
    # TODO: Evaluar expresión completa
    def evaluar(self, expresion):
        # Implementar evaluación con precedencia
        pass
    
    # TODO: Parsear tokens
    def parsear(self, expresion):
        # Implementar parser de expresiones
        pass

# Crear intérprete
interprete = InterpreteGalactico()

# TODO: Registrar funciones espaciales
def distancia_estelar(x1, y1, x2, y2):
    # Implementar cálculo de distancia
    pass

interprete.registrar_funcion("distancia_estelar", distancia_estelar)

# Expresiones de prueba
expresiones = [
    "2 + 3 * 4",
    "distancia_estelar(0, 0, 3, 4)",
    "(velocidad_warp(5) + 2) * factor_tiempo(0.8)"
]

print("? Evaluando comandos de navegación:")
for expr in expresiones:
    # TODO: Evaluar cada expresión
    print(f"{expr} = [IMPLEMENTAR]")

print("
? Sistema de navegación listo")', '? === CALCULADORA DE COMBUSTIBLE ESPACIAL ===
⛽ Combustible inicial: 1000 litros
? Consumo por aceleración: 150 litros
? Consumo por frenado: 75 litros
? Número de maniobras: 3

? Resultados de cálculos:
Consumo por maniobra: 225 litros
Consumo total misión: 675 litros
Combustible restante: 325 litros
Porcentaje restante: 32.5%
Combustible extra: 25 litros', 'Operaciones Matemáticas Galácticas');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (5, 2, 2, 'Listado de Misiones:

Como coordinador de misiones de AstroCode, debes crear un programa que gestione una lista de misiones espaciales pendientes. Para ello, implementarás dos funciones: una para agregar misiones a la lista y otra para mostrar todas las misiones almacenadas.

Objetivos del ejercicio:

- Se proporciona una lista vacía llamada misiones que almacenará las misiones.
- Debes completar la función agregar_mision(mision) para que añada el parámetro mision a la lista misiones.
- Completa la función mostrar_misiones() para que imprima todas las misiones en la lista con su número correspondiente (por ejemplo, “1. Explorar Marte”).
- Utiliza la función agregar_mision() para agregar las tres misiones indicadas en el código base.
- Finalmente, llama a mostrar_misiones() para que muestre la lista actualizada.

Nota: Recuerda que para agregar un elemento a una lista en Python se usa el método .append(), y que para recorrer una lista y obtener índices puedes usar enumerate().', NULL, 3, false, 3, 100, 50, 'print("Gestión de misiones espaciales\n")

misiones = []

def agregar_mision(mision):
    # TODO: Añade la misión a la lista misiones
    pass

def mostrar_misiones():
    # TODO: Muestra todas las misiones almacenadas con formato numerado
    pass

# Añade estas misiones a la lista usando la función agregar_mision
agregar_mision("Explorar Marte")
agregar_mision("Reparar satélite")
agregar_mision("Establecer base lunar")

# Muestra la lista actual de misiones
mostrar_misiones()
', 'Gestión de misiones espaciales
Misión añadida: Explorar Marte
Misión añadida: Reparar satélite
Misión añadida: Establecer base lunar
Lista actual de misiones:
1. Explorar Marte
2. Reparar satélite
3. Establecer base lunar
', 'Gestión de misiones espaciales');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (6, 2, 3, 'Como encargado de control de misión en AstroCode, tienes una matriz que representa los estados de sensores en una cuadrícula de módulos espaciales (cada fila es un módulo, cada columna un sensor). Los estados posibles son:

0: Sensor inactivo
1: Sensor activo
2: Sensor en error

Debes recorrer la matriz usando bucles anidados y generar:
Para cada módulo (fila), un reporte que indique cuántos sensores están activos, inactivos y en error.
Al final, mostrar el total de sensores en error en toda la nave.

Objetivos:

Recorrer la matriz con dos bucles for anidados.
Contar estados por fila y total.
Imprimir resultados claros por módulo y totales.

En este caso, el resultado debe ser:
Verificación de sensores en módulos espaciales

Módulo 1 - Activos: 2, Inactivos: 1, Errores: 1
Módulo 2 - Activos: 3, Inactivos: 1, Errores: 0
Módulo 3 - Activos: 1, Inactivos: 1, Errores: 2
Módulo 4 - Activos: 2, Inactivos: 2, Errores: 0

Total de sensores en error en la nave: 3
', NULL, 4, false, 5, 600, 150, 'print("Verificación de sensores en módulos espaciales\n")

sensores = [
    [1, 0, 2, 1],
    [1, 1, 1, 0],
    [0, 2, 2, 1],
    [1, 0, 0, 1]
]

def verificar_sensores(matriz):
    total_error = 0
    # TODO: Recorrer matriz, contar estados y mostrar por módulo
    pass

verificar_sensores(sensores)
', 'Verificación de sensores en módulos espaciales

Módulo 1 - Activos: 2, Inactivos: 1, Errores: 1
Módulo 2 - Activos: 3, Inactivos: 1, Errores: 0
Módulo 3 - Activos: 1, Inactivos: 1, Errores: 2
Módulo 4 - Activos: 2, Inactivos: 2, Errores: 0

Total de sensores en error en la nave: 3
', 'Matriz de módulos y verificación de estado
');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (8, 3, 2, 'Como ingeniero de sistemas de AstroCode, debes crear un programa que evalúe el estado del sistema de soporte vital basándose en los niveles de oxígeno, presión y temperatura.

Objetivos del ejercicio:
Crear una función evaluar_sistema(oxigeno, presion, temperatura) que reciba tres parámetros numéricos.
La función debe devolver un mensaje según estas condiciones:
- Si el oxígeno está entre 19.5 y 23.5 (inclusive), la presión entre 98 y 102 (inclusive), y la temperatura entre 18 y 27 (inclusive), devuelve:
"Sistema estable. Condiciones óptimas."

- Si alguno de los parámetros está fuera de estos rangos, devuelve:
"Alerta: Parámetros fuera de rango. Revisión necesaria."

Probar la función con diferentes valores y mostrar el resultado.', NULL, 3, false, 2, 100, 50, 'print("Evaluación del sistema de soporte vital\n")

def evaluar_sistema(oxigeno, presion, temperatura):
    # TODO: Implementa la función según las condiciones indicadas
    pass

# Pruebas de la función
print(evaluar_sistema(21, 100, 22))   # Condiciones óptimas
print(evaluar_sistema(18, 100, 22))   # Oxígeno bajo
print(evaluar_sistema(21, 105, 22))   # Presión alta
print(evaluar_sistema(21, 100, 30))   # Temperatura alta
', 'Evaluación del sistema de soporte vital
Sistema estable. Condiciones óptimas.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.
', 'Estado del sistema de soporte vital');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (9, 3, 3, 'En AstroCode, los códigos de acceso a los módulos secretos se generan con una variante especial de la secuencia de Fibonacci. Como ingeniero del sistema de seguridad, debes generar esta secuencia para validar los accesos.

Reglas del sistema:

La secuencia comienza en 1 y 1 (igual que Fibonacci clásico).
Cada nuevo número se obtiene como la suma de los dos anteriores + 1.
(Ejemplo: 1 + 1 + 1 = 3, 1 + 3 + 1 = 5, ...)
Para cada número generado, debes imprimir:
- "Código X: Y", donde X es la posición en la secuencia y Y es el valor.
Si el valor es múltiplo de 5, debes añadir la advertencia:
- "Código especial detectado!"

Objetivo:
Escribe un programa que imprima los 25 primeros códigos generados por esta secuencia especial, para verse así:

Decodificador de Accesos con Secuencia Astro-Fibonacci

Código 1: 1  
Código 2: 1  
Código 3: 3  
Código 4: 5  
  ¡Código especial detectado!
...
', NULL, 4, false, 4, 700, 150, 'print("Decodificador de Accesos con Secuencia Astro-Fibonacci\n")

# Primeros valores
a = 1
b = 1

# Imprimir los dos primeros códigos
print("Código 1:", a)
print("Código 2:", b)

# TODO: completar bucle para generar el resto de códigos
# y detectar los códigos especiales
', 'Decodificador de Accesos con Secuencia Astro-Fibonacci

Código 1: 1
Código 2: 1
Código 3: 3
Código 4: 5
Código especial detectado!
Código 5: 9
Código 6: 15
Código especial detectado!
Código 7: 25
Código especial detectado!
Código 8: 41
Código 9: 67
Código 10: 109
Código 11: 177
Código 12: 287
Código 13: 465
Código 14: 753
Código 15: 1219
Código 16: 1973
Código 17: 3193
Código 18: 5167
Código 19: 8361
Código 20: 13529
Código 21: 21891
Código 22: 35421
Código 23: 57313
Código 24: 92735
Código especial detectado!
Código 25: 150049
', 'Códigos cifrados de la nave con Fibonacci modificado');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (10, 4, 1, 'Misión: Secuencia de Lanzamiento

Como controlador de lanzamiento en AstroCode, debes programar la secuencia de cuenta regresiva para el despegue de la nave espacial.

Contexto de la misión:
Cada lanzamiento requiere una secuencia precisa de verificaciones. Tu programa debe generar la secuencia numérica y identificar los sistemas críticos (números pares).

Objetivos:
- Usa un bucle for para imprimir números del 1 al 10
- Modifica el programa para mostrar solo números pares
- Agrega mensajes de verificación de sistemas

Secuencia de verificación:
- Números 1-10: Verificación general
- Números pares: Sistemas críticos

Lo que se espera que se muestre es: 
Verificación sistema 1
Verificación sistema 2
Sistema crítico 2 operativo

¡Cada verificación es crucial para un lanzamiento exitoso!', NULL, 3, false, 1, 100, 50, '# No elimines esta línea de código
print("Iniciando secuencia de lanzamiento...\n")

# TODO: Imprime los números del 1 al 10 usando un bucle for
# TODO: Para cada número, muestra: Verificación sistema X
# TODO: Si el número es par, muestra también: Sistema crítico X operativo
', 'Iniciando secuencia de lanzamiento...
Verificación sistema 1
Verificación sistema 2
Sistema crítico 2 operativo
Verificación sistema 3
Verificación sistema 4
Sistema crítico 4 operativo
Verificación sistema 5
Verificación sistema 6
Sistema crítico 6 operativo
Verificación sistema 7
Verificación sistema 8
Sistema crítico 8 operativo
Verificación sistema 9
Verificación sistema 10
Sistema crítico 10 operativo', 'Cuenta Regresiva de Lanzamiento');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (11, 4, 2, 'Como explorador espacial de AstroCode, tienes una lista con los nombres de los planetas que ya has explorado. Debes crear un programa que recorra esa lista y muestre cada planeta con su posición en la lista.

Objetivos del ejercicio:

Se proporciona una lista llamada planetas con varios nombres.

Usa un bucle para recorrer la lista y mostrar cada planeta con su número de orden (empezando en 1).

La salida debe tener el formato:
Planeta 1: Mercurio
Planeta 2: Venus
...etc.', NULL, 3, false, 3, 100, 50, 'print("Listado de planetas explorados")

planetas = ["Mercurio", "Venus", "Tierra", "Marte", "Júpiter"]

# TODO: Recorrer la lista y mostrar cada planeta con su posición
', 'Listado de planetas explorados
Planeta 1: Mercurio
Planeta 2: Venus
Planeta 3: Tierra
Planeta 4: Marte
Planeta 5: Júpiter
', 'Listado de planetas explorados');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (14, 5, 2, 'Como ingeniero de la misión en AstroCode, tienes una lista con la cantidad de combustible que requiere cada módulo de la nave espacial. Debes calcular el total de combustible necesario, pero solo sumando los módulos que requieren más de 150 litros.

Objetivos del ejercicio:

Usar un bucle para recorrer la lista combustibles.

Sumar solo los valores mayores a 150 litros.

Mostrar el total con el mensaje:
Combustible total necesario (sólo módulos > 150 litros): XX litros', NULL, 3, false, 3, 100, 50, 'print("Cálculo del combustible total necesario (con filtro)\n")

combustibles = [150, 200, 340, 125, 400]

total = 0

# TODO: Recorrer la lista y sumar sólo los valores mayores a 150

# TODO: Mostrar el resultado con el mensaje adecuado
', 'Cálculo del combustible total necesario (con filtro)

Combustible total necesario (sólo módulos > 150 litros): 940 litros
', 'Cálculo del combustible total necesario');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (16, 6, 1, 'Comprobación del Traje Espacial

Antes de salir al exterior de la nave, los astronautas deben comprobar si su traje espacial está listo. Tu programa debe solicitar al usuario una respuesta (sí o no) y mostrar un mensaje en consecuencia.

Objetivo del ejercicio:

Pedir al usuario que escriba si su traje está listo (sí o no).

Si la respuesta es "sí", imprimir:
	Traje listo. Puedes salir al exterior.

Si la respuesta es "no", imprimir:
	Verifica el sistema de soporte vital antes de salir.', NULL, 3, false, 2, 100, 50, 'print("Comprobación del traje espacial:")

# TODO: Pide al usuario que indique si su traje está listo (sí o no)

# TODO: Usa una estructura if para mostrar el mensaje adecuado
', 'Comprobación del traje espacial:
Traje listo. Puedes salir al exterior.', 'Comprobación del Traje Espacial');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (17, 6, 2, 'En AstroCode, debes clasificar a los astronautas en dos grupos según su edad: "Jóvenes" (menores de 35 años) y "Veteranos" (35 años o más). Luego, imprime cada astronauta con un mensaje que indique su grupo y número en la lista.

Objetivos del ejercicio:
Recorrer la lista edades.
Para cada astronauta, imprimir el mensaje:
- Astronauta joven X: edad si tiene menos de 35 años.
- Astronauta veterano X: edad si tiene 35 o más.
El número X debe ser un contador independiente para cada grupo.

Debería verse así:
Clasificación detallada de astronautas por edad
Astronauta joven 1: 29
Astronauta veterano 1: 42
Astronauta joven 2: 33', NULL, 3, false, 3, 100, 50, 'print("Clasificación detallada de astronautas por edad")

edades = [29, 42, 33, 37, 25, 40]

contador_jovenes = 0
contador_veteranos = 0

# TODO: Recorrer la lista edades y mostrar el mensaje para cada astronauta
', 'Clasificación detallada de astronautas por edad
Astronauta joven 1: 29
Astronauta veterano 1: 42
Astronauta joven 2: 33', 'Clasificación detallada de astronautas por edad
');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (18, 6, 3, 'Como responsable de la planificación en AstroCode, debes diseñar un programa que gestione una lista de misiones espaciales, cada una con un nombre, duración en días y recursos necesarios (combustible y tripulación). El programa debe:

Permitir añadir nuevas misiones a la lista.
Calcular el total de recursos usados en todas las misiones.
Evaluar cuáles misiones pueden ser realizadas con recursos limitados dados por el usuario.
Mostrar un resumen detallado.

Objetivos del ejercicio:

Crear una lista de misiones, donde cada misión es un diccionario con claves: "nombre", "duracion", "combustible", "tripulacion".
Crear función agregar_mision(lista, mision) para añadir misiones.
Crear función total_recursos(lista) que calcule total de combustible y tripulación usados.
Crear función misiones_posibles(lista, max_combustible, max_tripulacion) que devuelva la lista de misiones que caben dentro de esos límites.
Mostrar un resumen con el total y las misiones posibles.

Debe verse así: 
Gestión avanzada de misiones espaciales

Total combustible requerido: 13000
Total tripulación requerida: 14

Misiones que pueden realizarse con 8000 combustible y 8 tripulación:
- Estudio Asteroides
', NULL, 4, false, 5, 500, 150, 'print("Gestión avanzada de misiones espaciales\n")

misiones = [
    {"nombre": "Exploración Marte", "duracion": 30, "combustible": 5000, "tripulacion": 6},
    {"nombre": "Estudio Asteroides", "duracion": 20, "combustible": 3000, "tripulacion": 4},
]

def agregar_mision(lista, mision):
    # TODO: Añadir misión a la lista
    pass

def total_recursos(lista):
    # TODO: Calcular total combustible y tripulación
    pass

def misiones_posibles(lista, max_combustible, max_tripulacion):
    # TODO: Devolver lista de misiones que cumplen requisitos
    pass

# Ejemplo de uso: agregar una misión nueva
# TODO: Usar agregar_mision para añadir misión

# TODO: Mostrar total recursos

# TODO: Mostrar misiones posibles con límites dados
', 'Gestión avanzada de misiones espaciales

Total combustible requerido: 13000
Total tripulación requerida: 14

Misiones que pueden realizarse con 8000 combustible y 8 tripulación:
- Estudio Asteroides', 'Gestión avanzada de misiones y recursos');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (19, 7, 1, 'Misión: Registro de Nave Espacial

Como administrador de flota de AstroCode, necesitas registrar los datos de una nueva nave espacial utilizando variables simples.

Contexto de la misión:
La flota espacial está creciendo. Es tu responsabilidad almacenar correctamente la información de cada nave para llevar un control de su estado antes del despegue.

Objetivos del ejercicio: crea cuatro variables:
nombre → "Estrella Polar"
tipo → "Explorador"
tripulacion → 5
combustible → 750

Usa print() para mostrar este mensaje final (usando las variables):

Nave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750', NULL, 3, false, 2, 100, 50, 'print("Registro de nave espacial\n")

# TODO: Define las variables nombre, tipo, tripulacion y combustible

# TODO: Imprime el mensaje con los datos de la nave
', 'Registro de nave espacial
Nave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750
', 'Registro de la Nave Espacial');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (20, 7, 2, 'Como técnico de control en AstroCode, debes crear un programa que:

- Mantenga los niveles de oxígeno de varios módulos.
- Permita actualizar el nivel de oxígeno de cualquier módulo.
- Evalúe y clasifique los niveles actuales en "CRÍTICO", "ESTABLE" o "ALTO" según un nivel crítico definido por el usuario.
- Genere un informe detallado y el total de módulos en estado crítico.

Objetivos del ejercicio:

Crear una lista niveles_oxigeno con porcentajes iniciales.
Crear una función actualizar_nivel(niveles, modulo, nuevo_nivel) que actualice el nivel de oxígeno del módulo indicado.

Crear una función monitor_oxigeno(niveles, nivel_critico) que:

Recorra los niveles y clasifique cada módulo:

- Menor que nivel_critico: "CRÍTICO"
- Entre nivel_critico y 23.5%: "ESTABLE"
- Mayor a 23.5%: "ALTO"

Imprima estado y porcentaje de cada módulo.
Devuelva el número total de módulos críticos.
Usar las funciones para actualizar algunos niveles y luego mostrar el informe.

Debe verse así:
Monitor y gestión dinámica de niveles de oxígeno
Módulo 1: ESTABLE (20.1%)
Módulo 2: CRÍTICO (17.0%)
Módulo 3: ESTABLE (19.5%)
Módulo 4: ALTO (24.0%)
Módulo 5: CRÍTICO (18.0%)
Módulo 6: ALTO (25.3%)
Total de módulos críticos: 2
', NULL, 3, false, 4, 200, 100, 'print("Monitor y gestión dinámica de niveles de oxígeno")

niveles_oxigeno = [20.1, 18.7, 19.5, 24.0, 22.0, 25.3]

def actualizar_nivel(niveles, modulo, nuevo_nivel):
    # TODO: Actualizar nivel de oxígeno del módulo indicado
    pass

def monitor_oxigeno(niveles, nivel_critico):
    criticos = 0
    # TODO: Recorrer niveles, clasificar e imprimir estado
    # TODO: Contar y devolver módulos críticos
    pass

# Actualiza algunos niveles (por ejemplo, módulo 2 y módulo 5)
# TODO: Llamar a actualizar_nivel para modificar niveles

nivel_critico = 19.5
total_criticos = monitor_oxigeno(niveles_oxigeno, nivel_critico)

print(f"Total de módulos críticos: {total_criticos}")
', 'Monitor y gestión dinámica de niveles de oxígeno
Módulo 1: ESTABLE (20.1%)
Módulo 2: CRÍTICO (17.0%)
Módulo 3: ESTABLE (19.5%)
Módulo 4: ALTO (24.0%)
Módulo 5: CRÍTICO (18.0%)
Módulo 6: ALTO (25.3%)
Total de módulos críticos: 2
', 'Monitor y gestión dinámica de niveles de oxígeno
');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (21, 7, 3, 'En el centro de control de AstroCode has recibido un paquete con múltiples señales de distintas sondas. Estas señales son valores enteros que pueden estar afectados por interferencias.

Tu misión:
Filtrar, clasificar y analizar las señales útiles.

Requisitos de la misión:
Tienes una lista de señales que puede contener enteros positivos y negativos.
Una señal es válida si es positiva y múltiplo de 3 o 5.

Las señales válidas deben ser:

Filtradas.
Ordenadas de mayor a menor.
Después, recórrelas con un for y muestra una salida con este formato:
"Señal X: Y unidades"
(donde X es la posición en la lista ordenada y Y es el valor).

Al final, muestra la media aritmética de las señales válidas.', NULL, 5, false, 5, 600, 150, 'print("Clasificación de Señales Interplanetarias\n")

lecturas = [12, -3, 7, 15, 5, -20, 30, 4, 9, 22, 45, -1, 8, 6]

# TODO:
# 1. Filtrar señales válidas (positivas y múltiplo de 3 o 5)
# 2. Ordenarlas de mayor a menor
# 3. Mostrar cada señal con su posición
# 4. Calcular la media de las señales válidas
', 'Clasificación de Señales Interplanetarias

Señal 1: 45 unidades  
Señal 2: 30 unidades  
Señal 3: 15 unidades  
Señal 4: 12 unidades  
Señal 5: 9 unidades  
Señal 6: 6 unidades  
Señal 7: 5 unidades  

Media de señales válidas: 17.43
', 'Detección de Señales Anómalas en AstroCode');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (25, 9, 1, 'Recuento de Satélites

Como operador de comunicaciones de AstroCode, estás haciendo un recuento de satélites en órbita. Ya hay 12 satélites activos y hoy se han lanzado 3 nuevos. La capacidad máxima de la órbita es 15 satélites.

Objetivos del ejercicio:

Crea variables:
satelites_activos = 12
nuevos_satelites = 3
capacidad_orbita = 15

Calcula el total de satélites en órbita.
Imprime el mensaje con el total:
Satélites totales en órbita: X

Usa un if para comprobar si el total es menor o igual que la capacidad.

Si es así, imprime: Orbita con espacio disponible.
Si no, imprime: Capacidad máxima superada, órbita saturada.', NULL, 3, false, 2, 100, 50, 'print("Recuento de satélites en órbita y capacidad\n")

satelites_activos = 12
nuevos_satelites = 3
capacidad_orbita = 15

# TODO: Calcula el total de satélites

# TODO: Imprime el mensaje con el total de satélites

# TODO: Usa un if para mostrar el mensaje correcto según la capacidad
', 'Recuento de satélites en órbita y capacidad
Satélites totales en órbita: 15
Orbita con espacio disponible.', 'Recuento de Satélites');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (28, 10, 1, 'Contraseña Segura de Nave

Para acceder al control de la nave, debes ingresar la contraseña correcta "ASTROCODE". El sistema te pide la contraseña 3 veces seguidas, aunque aciertes antes. Al final, te dirá si tu acceso fue concedido o denegado.

Objetivos del ejercicio:

- Usar un bucle que pida la contraseña 3 veces, guardando si alguna vez fue correcta.

En cada intento, si la contraseña no es correcta, muestra:
- Contraseña incorrecta. Reintente.

Al final, muestra:

Si acertaste alguna vez:
- Acceso concedido. Bienvenido al control de la nave.

Si no acertaste ninguna vez:
- Acceso denegado. Demasiados intentos fallidos.

', NULL, 3, false, 3, 100, 50, 'print("Verificación de contraseña con 3 intentos obligatorios\n")

acceso = False

for intento in range(3):
    contraseña = input(f"Intento {intento + 1}: Introduce la contraseña: ")
    
    if contraseña == "ASTROCODE":
        acceso = True
    else:
        print("Contraseña incorrecta. Asegúrate de usar mayúsculas.")

if acceso:
    print("Acceso concedido. Bienvenido al control de la nave.")
else:
    print("Acceso denegado. Demasiados intentos fallidos.")
', 'Verificación de contraseña con 3 intentos obligatorios
Intento 1: Introduce la contraseña: astrocod
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Intento 2: Introduce la contraseña: astrocode
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Intento 3: Introduce la contraseña: ASTROCODE
Acceso concedido. Bienvenido al control de la nave.
', 'Pila de Comandos de Nave');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (46, 16, 4, 'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.', '2025-07-12', 5, false, 5, 1000, 0, 'class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

def invertir_arbol(raiz):
    # Tu código aquí
    pass', 'def invertir_arbol(raiz):
    if raiz is None:
        return None
    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)
    return raiz', 'Invertir un Árbol Binario');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (47, 16, 4, 'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.', '2025-07-13', 5, false, 5, 1000, 0, 'def es_valido(cadena):
    # Tu código aquí
    pass', 'def es_valido(cadena):
    pila = []
    mapa = {")": "(", "}": "{", "]": "["}
    for char in cadena:
        if char in mapa:
            elemento_pop = pila.pop() if pila else "#"
            if mapa[char] != elemento_pop:
                return False
        else:
            pila.append(char)
    return not pila', 'Validar Paréntesis');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (48, 16, 4, 'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.', '2025-07-14', 5, false, 5, 1000, 0, 'def encontrar_faltante(numeros):
    # Tu código aquí
    pass', 'def encontrar_faltante(numeros):
    n = len(numeros) + 1
    suma_esperada = n * (n + 1) // 2
    suma_real = sum(numeros)
    return suma_esperada - suma_real', 'Encontrar el Número Faltante');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (49, 16, 4, 'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.', '2025-07-15', 5, false, 5, 1000, 0, 'class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

def invertir_arbol(raiz):
    # Tu código aquí
    pass', 'def invertir_arbol(raiz):
    if raiz is None:
        return None
    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)
    return raiz', 'Invertir un Árbol Binario');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (50, 16, 4, 'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.', '2025-07-16', 5, false, 5, 1000, 0, 'def es_valido(cadena):
    # Tu código aquí
    pass', 'def es_valido(cadena):
    pila = []
    mapa = {")": "(", "}": "{", "]": "["}
    for char in cadena:
        if char in mapa:
            elemento_pop = pila.pop() if pila else "#"
            if mapa[char] != elemento_pop:
                return False
        else:
            pila.append(char)
    return not pila', 'Validar Paréntesis');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (51, 16, 4, 'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.', '2025-07-17', 5, false, 5, 1000, 0, 'def encontrar_faltante(numeros):
    # Tu código aquí
    pass', 'def encontrar_faltante(numeros):
    n = len(numeros) + 1
    suma_esperada = n * (n + 1) // 2
    suma_real = sum(numeros)
    return suma_esperada - suma_real', 'Encontrar el Número Faltante');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (52, 16, 4, 'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.', '2025-07-18', 5, false, 5, 1000, 0, 'class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

def invertir_arbol(raiz):
    # Tu código aquí
    pass', 'def invertir_arbol(raiz):
    if raiz is None:
        return None
    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)
    return raiz', 'Invertir un Árbol Binario');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (53, 16, 4, 'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.', '2025-07-19', 5, false, 5, 1000, 0, 'def es_valido(cadena):
    # Tu código aquí
    pass', 'def es_valido(cadena):
    pila = []
    mapa = {")": "(", "}": "{", "]": "["}
    for char in cadena:
        if char in mapa:
            elemento_pop = pila.pop() if pila else "#"
            if mapa[char] != elemento_pop:
                return False
        else:
            pila.append(char)
    return not pila', 'Validar Paréntesis');
INSERT INTO tareas (id, categoria_id, nivel_id, descripcion, fecha_vencimiento, prioridad, completado, tiempo_finalizacion_id, puntos_base, puntos_bonus, codigo_base, resultado_esperado, titulo) VALUES (54, 16, 4, 'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.', '2025-07-20', 5, false, 5, 1000, 0, 'def encontrar_faltante(numeros):
    # Tu código aquí
    pass', 'def encontrar_faltante(numeros):
    n = len(numeros) + 1
    suma_esperada = n * (n + 1) // 2
    suma_real = sum(numeros)
    return suma_esperada - suma_real', 'Encontrar el Número Faltante');
