CREATE DATABASE  IF NOT EXISTS `astrocodebd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `astrocodebd`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: astrocodebd
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (11,'Algoritmos Avanzados'),(15,'Algoritmos de Búsqueda'),(8,'Algoritmos de Ordenamiento'),(6,'Arrays y Listas'),(4,'Bucles'),(3,'Estructuras Condicionales'),(10,'Estructuras de Datos'),(5,'Funciones'),(13,'Grafos y Árboles'),(7,'Objetos y Clases'),(2,'Operadores'),(14,'Optimización'),(12,'Programación Dinámica'),(9,'Recursión'),(16,'Reto Diario'),(1,'Variables y Tipos');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insignias`
--

DROP TABLE IF EXISTS `insignias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insignias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `url_imagen` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insignias`
--

LOCK TABLES `insignias` WRITE;
/*!40000 ALTER TABLE `insignias` DISABLE KEYS */;
INSERT INTO `insignias` VALUES (1,'Primer Despegue','Completó su primer ejercicio en la plataforma.','https://img.icons8.com/color/96/rocket--v1.png'),(2,'Explorador Constante','Ha completado 5 ejercicios de nivel Fácil.','https://img.icons8.com/color/96/planet.png'),(3,'Desafío Superado','Ha completado un ejercicio de nivel Difícil.','https://img.icons8.com/color/96/medal2--v1.png'),(4,'Velocidad de la Luz','Completó un ejercicio en menos de 30 segundos.','https://img.icons8.com/color/96/flash-on--v1.png'),(5,'Maestro de la Misión','Completó todos los ejercicios de una categoría.','https://img.icons8.com/color/96/galaxy.png'),(6,'Reto Diario','Completó un reto diario en el mismo día.','https://img.icons8.com/color/96/calendar-3.png'),(7,'Beta Tester','Formó parte del equipo de pruebas inicial.','https://img.icons8.com/color/96/test-account.png');
/*!40000 ALTER TABLE `insignias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insignias_usuarios`
--

DROP TABLE IF EXISTS `insignias_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insignias_usuarios` (
  `usuario_id` bigint NOT NULL,
  `insignia_id` bigint NOT NULL,
  `ganado_el` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`,`insignia_id`),
  KEY `insignia_id` (`insignia_id`),
  CONSTRAINT `insignias_usuarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `insignias_usuarios_ibfk_2` FOREIGN KEY (`insignia_id`) REFERENCES `insignias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insignias_usuarios`
--

LOCK TABLES `insignias_usuarios` WRITE;
/*!40000 ALTER TABLE `insignias_usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `insignias_usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niveles`
--

DROP TABLE IF EXISTS `niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `niveles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `puntos` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niveles`
--

LOCK TABLES `niveles` WRITE;
/*!40000 ALTER TABLE `niveles` DISABLE KEYS */;
INSERT INTO `niveles` VALUES (1,'Fácil',50),(2,'Intermedio',100),(3,'Difícil',250),(4,'Reto Diario',500);
/*!40000 ALTER TABLE `niveles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `categoria_id` bigint NOT NULL,
  `nivel_id` bigint NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `prioridad` int DEFAULT NULL,
  `completado` tinyint(1) DEFAULT '0',
  `tiempo_finalizacion_id` bigint DEFAULT NULL,
  `puntos_base` int DEFAULT NULL,
  `puntos_bonus` int DEFAULT '0',
  `codigo_base` text COMMENT 'Código base/plantilla para el ejercicio',
  `resultado_esperado` text COMMENT 'Resultado esperado que debe mostrar el código al ejecutarse',
  `titulo` varchar(255) NOT NULL DEFAULT '' COMMENT 'Título descriptivo del ejercicio',
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `nivel_id` (`nivel_id`),
  KEY `tiempo_finalizacion_id` (`tiempo_finalizacion_id`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`nivel_id`) REFERENCES `niveles` (`id`),
  CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`tiempo_finalizacion_id`) REFERENCES `tiempos_finalizacion` (`id`),
  CONSTRAINT `tareas_chk_1` CHECK ((`prioridad` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,1,1,'Misión: Configuración de Nave Espacial\n\nComo nuevo cadete de AstroCode, tu primera misión es configurar los sistemas básicos de tu nave espacial. Debes declarar una variable para almacenar la edad del comandante.\n\nContexto de la misión:\nEstás a bordo de la estación espacial AstroCode-1, preparándote para tu primer viaje intergaláctico. El sistema de navegación requiere que registres la edad del comandante para calcular los parámetros de vuelo.\n\n**Objetivos:**\n- Declara una variable llamada \"edad\" de tipo entero\n- Asígnale el valor 25\n- Imprime su valor en la consola con un mensaje espacial\n\n¡Completa esta configuración para poder despegar hacia las estrellas!',NULL,3,0,1,50,50,'print(\"? === REGISTRO DE COMANDANTE ESPACIAL ===\")\n\n# TODO: Declara la variable edad y asígnale el valor 25\n\n# TODO: Imprime el valor con un mensaje\nprint(f\"Edad del comandante: {edad} años terrestres\")\nprint(\"✅ Comandante registrado - Listo para el despegue!\")','? === REGISTRO DE COMANDANTE ESPACIAL ===\nEdad del comandante: 25 años terrestres\n✅ Comandante registrado - Listo para el despegue!','Variables Espaciales Básicas'),(2,1,2,'Misión: Sistema de Telemetría Avanzada\n\nComo ingeniero de sistemas de la estación AstroCode, debes crear un programa de telemetría que maneje diferentes tipos de datos de la nave y realice conversiones entre ellos.\n\nContexto de la misión:\nLos sensores de la nave envían datos en diferentes formatos. Tu sistema debe procesar y convertir estos datos para que sean compatibles con el ordenador central.\n\nObjetivos:\n- Declara variables de diferentes tipos (entero, flotante, string, booleano)\n- Realiza conversiones entre tipos\n- Muestra los resultados de cada conversión\n\nDatos de sensores:\n- Velocidad: \"2500\" (string) → convertir a número\n- Temperatura: 98.6 (float) → convertir a entero\n- Coordenada X: 42 (int) → convertir a string\n- Sistema activo: 1 (int) → convertir a booleano\n\n¡La precisión de los datos es crucial para la navegación!',NULL,3,0,2,100,50,'print(\"? === LABORATORIO DE TIPOS CUÁNTICOS ===\")\n\n# Sistema de detección automática de tipos\nclass DetectorTipos:\n    # TODO: Implementar detección automática de tipos\n    @staticmethod\n    def detectar_tipo(muestra):\n        # Implementar lógica de detección\n        pass\n    \n    # TODO: Implementar conversiones seguras\n    @staticmethod\n    def convertir_seguro(valor, tipo_destino):\n        # Implementar conversiones con validación\n        pass\n    \n    # TODO: Implementar operaciones entre tipos\n    @staticmethod\n    def operar_tipos(valor1, valor2, operacion):\n        # Implementar operaciones seguras\n        pass\n\n# Muestras de prueba\nmuestras = [42, \"Helio-3\", 3.14159, True, None, {\"elemento\": \"Hidrógeno\"}]\n\nprint(\"? Analizando muestras extraterrestres:\")\nfor index, muestra in enumerate(muestras):\n    # TODO: Usar DetectorTipos para analizar cada muestra\n    print(f\"Muestra {index + 1}: {muestra} -> Tipo: [IMPLEMENTAR]\")\n\nprint(\"\n? Pruebas de conversión segura:\")\n# TODO: Implementar pruebas de conversión\n\nprint(\"\n⚗️ Análisis completado\")','?️ === SISTEMA DE TELEMETRÍA ESPACIAL ===\n? Datos originales:\nVelocidad (string): 2500\nTemperatura (float): 98.6\nCoordenada X (int): 42\nSistema activo (int): 1\n\n? Datos convertidos:\nVelocidad (number): 2500 km/h\nTemperatura (int): 98°C\nCoordenada X (string): \"42\"\nSistema activo (boolean): true\n\n✅ Telemetría procesada correctamente!','Sistema de Tipos Avanzado Espacial'),(3,1,3,'Como astrónomo en AstroCode, tienes una lista con las distancias (en millones de kilómetros) a varios planetas del sistema solar. Debes ordenar la lista de menor a mayor distancia, pero hay un requisito especial:\nLos planetas con distancias múltiplos de 3 deben aparecer al principio, ordenados ascendentemente.\nLuego, el resto de planetas también ordenados ascendentemente.\n\nObjetivos del ejercicio:\n\nDada una lista distancias con números enteros.\nCrear una función ordenar_distancias(distancias) que:\nSepare los números múltiplos de 3 y los demás.\nOrdene ambos grupos por separado de menor a mayor.\nDevuelva una lista con los múltiplos de 3 primero, luego el resto.\nImprimir la lista ordenada resultante.\n\nQueremos que se vea así:\nOrdenación especial de distancias planetarias\n\n[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]\n\nNOTA: para imprimir el array, únicamente debes hacer print(nombre_array)',NULL,4,0,4,500,150,'print(\"Ordenación especial de distancias planetarias\\n\")\n\ndistancias = [58, 108, 149, 227, 384, 778, 1430, 2870, 4500]\n\ndef ordenar_distancias(distancias):\n    # TODO: Separar múltiplos de 3 y otros\n    # TODO: Ordenar ambas listas\n    # TODO: Unir y devolver resultado\n    pass\n\ndistancias_ordenadas = ordenar_distancias(distancias)\nprint(distancias_ordenadas)\n','Ordenación especial de distancias planetarias\n\n[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]\n','Ordenar las distancias de planetas'),(4,2,1,'Misión: Calculadora de Combustible Espacial\n\nComo técnico de combustible en la estación AstroCode, debes crear un programa que calcule el consumo de combustible para diferentes maniobras espaciales.\n\nContexto de la misión:\nLa nave necesita realizar cálculos precisos de combustible antes de cada maniobra. Tu calculadora debe usar operadores aritméticos para determinar el combustible necesario.\n\nObjetivos:\n- Usa operadores aritméticos (+, -, *, /, %) \n- Calcula combustible para aceleración, frenado y maniobras\n- Muestra los resultados de cada operación\n\nDatos de entrada:\n- Combustible inicial: 1000 litros\n- Consumo por aceleración: 150 litros\n- Consumo por frenado: 75 litros\n\n⛽ ¡Cada gota de combustible cuenta en el espacio!',NULL,3,0,1,50,50,'print(\"? === INTÉRPRETE DE COMANDOS GALÁCTICOS ===\")\n\n# Intérprete de expresiones espaciales\nclass InterpreteGalactico:\n    def __init__(self):\n        self.operadores = {}\n        self.funciones = {}\n        self.inicializar_operadores()\n    \n    # TODO: Inicializar operadores personalizados\n    def inicializar_operadores(self):\n        # Implementar operadores espaciales\n        pass\n    \n    # TODO: Registrar función personalizada\n    def registrar_funcion(self, nombre, funcion):\n        # Implementar registro de funciones\n        pass\n    \n    # TODO: Evaluar expresión completa\n    def evaluar(self, expresion):\n        # Implementar evaluación con precedencia\n        pass\n    \n    # TODO: Parsear tokens\n    def parsear(self, expresion):\n        # Implementar parser de expresiones\n        pass\n\n# Crear intérprete\ninterprete = InterpreteGalactico()\n\n# TODO: Registrar funciones espaciales\ndef distancia_estelar(x1, y1, x2, y2):\n    # Implementar cálculo de distancia\n    pass\n\ninterprete.registrar_funcion(\"distancia_estelar\", distancia_estelar)\n\n# Expresiones de prueba\nexpresiones = [\n    \"2 + 3 * 4\",\n    \"distancia_estelar(0, 0, 3, 4)\",\n    \"(velocidad_warp(5) + 2) * factor_tiempo(0.8)\"\n]\n\nprint(\"? Evaluando comandos de navegación:\")\nfor expr in expresiones:\n    # TODO: Evaluar cada expresión\n    print(f\"{expr} = [IMPLEMENTAR]\")\n\nprint(\"\n? Sistema de navegación listo\")','? === CALCULADORA DE COMBUSTIBLE ESPACIAL ===\n⛽ Combustible inicial: 1000 litros\n? Consumo por aceleración: 150 litros\n? Consumo por frenado: 75 litros\n? Número de maniobras: 3\n\n? Resultados de cálculos:\nConsumo por maniobra: 225 litros\nConsumo total misión: 675 litros\nCombustible restante: 325 litros\nPorcentaje restante: 32.5%\nCombustible extra: 25 litros','Operaciones Matemáticas Galácticas'),(5,2,2,'Listado de Misiones:\n\nComo coordinador de misiones de AstroCode, debes crear un programa que gestione una lista de misiones espaciales pendientes. Para ello, implementarás dos funciones: una para agregar misiones a la lista y otra para mostrar todas las misiones almacenadas.\n\nObjetivos del ejercicio:\n\n- Se proporciona una lista vacía llamada misiones que almacenará las misiones.\n- Debes completar la función agregar_mision(mision) para que añada el parámetro mision a la lista misiones.\n- Completa la función mostrar_misiones() para que imprima todas las misiones en la lista con su número correspondiente (por ejemplo, “1. Explorar Marte”).\n- Utiliza la función agregar_mision() para agregar las tres misiones indicadas en el código base.\n- Finalmente, llama a mostrar_misiones() para que muestre la lista actualizada.\n\nNota: Recuerda que para agregar un elemento a una lista en Python se usa el método .append(), y que para recorrer una lista y obtener índices puedes usar enumerate().',NULL,3,0,3,100,50,'print(\"Gestión de misiones espaciales\\n\")\n\nmisiones = []\n\ndef agregar_mision(mision):\n    # TODO: Añade la misión a la lista misiones\n    pass\n\ndef mostrar_misiones():\n    # TODO: Muestra todas las misiones almacenadas con formato numerado\n    pass\n\n# Añade estas misiones a la lista usando la función agregar_mision\nagregar_mision(\"Explorar Marte\")\nagregar_mision(\"Reparar satélite\")\nagregar_mision(\"Establecer base lunar\")\n\n# Muestra la lista actual de misiones\nmostrar_misiones()\n','Gestión de misiones espaciales\nMisión añadida: Explorar Marte\nMisión añadida: Reparar satélite\nMisión añadida: Establecer base lunar\nLista actual de misiones:\n1. Explorar Marte\n2. Reparar satélite\n3. Establecer base lunar\n','Gestión de misiones espaciales'),(6,2,3,'Como encargado de control de misión en AstroCode, tienes una matriz que representa los estados de sensores en una cuadrícula de módulos espaciales (cada fila es un módulo, cada columna un sensor). Los estados posibles son:\n\n0: Sensor inactivo\n1: Sensor activo\n2: Sensor en error\n\nDebes recorrer la matriz usando bucles anidados y generar:\nPara cada módulo (fila), un reporte que indique cuántos sensores están activos, inactivos y en error.\nAl final, mostrar el total de sensores en error en toda la nave.\n\nObjetivos:\n\nRecorrer la matriz con dos bucles for anidados.\nContar estados por fila y total.\nImprimir resultados claros por módulo y totales.\n\nEn este caso, el resultado debe ser:\nVerificación de sensores en módulos espaciales\n\nMódulo 1 - Activos: 2, Inactivos: 1, Errores: 1\nMódulo 2 - Activos: 3, Inactivos: 1, Errores: 0\nMódulo 3 - Activos: 1, Inactivos: 1, Errores: 2\nMódulo 4 - Activos: 2, Inactivos: 2, Errores: 0\n\nTotal de sensores en error en la nave: 3\n',NULL,4,0,5,600,150,'print(\"Verificación de sensores en módulos espaciales\\n\")\n\nsensores = [\n    [1, 0, 2, 1],\n    [1, 1, 1, 0],\n    [0, 2, 2, 1],\n    [1, 0, 0, 1]\n]\n\ndef verificar_sensores(matriz):\n    total_error = 0\n    # TODO: Recorrer matriz, contar estados y mostrar por módulo\n    pass\n\nverificar_sensores(sensores)\n','Verificación de sensores en módulos espaciales\n\nMódulo 1 - Activos: 2, Inactivos: 1, Errores: 1\nMódulo 2 - Activos: 3, Inactivos: 1, Errores: 0\nMódulo 3 - Activos: 1, Inactivos: 1, Errores: 2\nMódulo 4 - Activos: 2, Inactivos: 2, Errores: 0\n\nTotal de sensores en error en la nave: 3\n','Matriz de módulos y verificación de estado\n'),(8,3,2,'Como ingeniero de sistemas de AstroCode, debes crear un programa que evalúe el estado del sistema de soporte vital basándose en los niveles de oxígeno, presión y temperatura.\n\nObjetivos del ejercicio:\nCrear una función evaluar_sistema(oxigeno, presion, temperatura) que reciba tres parámetros numéricos.\nLa función debe devolver un mensaje según estas condiciones:\n- Si el oxígeno está entre 19.5 y 23.5 (inclusive), la presión entre 98 y 102 (inclusive), y la temperatura entre 18 y 27 (inclusive), devuelve:\n\"Sistema estable. Condiciones óptimas.\"\n\n- Si alguno de los parámetros está fuera de estos rangos, devuelve:\n\"Alerta: Parámetros fuera de rango. Revisión necesaria.\"\n\nProbar la función con diferentes valores y mostrar el resultado.',NULL,3,0,2,100,50,'print(\"Evaluación del sistema de soporte vital\\n\")\n\ndef evaluar_sistema(oxigeno, presion, temperatura):\n    # TODO: Implementa la función según las condiciones indicadas\n    pass\n\n# Pruebas de la función\nprint(evaluar_sistema(21, 100, 22))   # Condiciones óptimas\nprint(evaluar_sistema(18, 100, 22))   # Oxígeno bajo\nprint(evaluar_sistema(21, 105, 22))   # Presión alta\nprint(evaluar_sistema(21, 100, 30))   # Temperatura alta\n','Evaluación del sistema de soporte vital\nSistema estable. Condiciones óptimas.\nAlerta: Parámetros fuera de rango. Revisión necesaria.\nAlerta: Parámetros fuera de rango. Revisión necesaria.\nAlerta: Parámetros fuera de rango. Revisión necesaria.\n','Estado del sistema de soporte vital'),(9,3,3,'En AstroCode, los códigos de acceso a los módulos secretos se generan con una variante especial de la secuencia de Fibonacci. Como ingeniero del sistema de seguridad, debes generar esta secuencia para validar los accesos.\n\nReglas del sistema:\n\nLa secuencia comienza en 1 y 1 (igual que Fibonacci clásico).\nCada nuevo número se obtiene como la suma de los dos anteriores + 1.\n(Ejemplo: 1 + 1 + 1 = 3, 1 + 3 + 1 = 5, ...)\nPara cada número generado, debes imprimir:\n- \"Código X: Y\", donde X es la posición en la secuencia y Y es el valor.\nSi el valor es múltiplo de 5, debes añadir la advertencia:\n- \"Código especial detectado!\"\n\nObjetivo:\nEscribe un programa que imprima los 25 primeros códigos generados por esta secuencia especial, para verse así:\n\nDecodificador de Accesos con Secuencia Astro-Fibonacci\n\nCódigo 1: 1  \nCódigo 2: 1  \nCódigo 3: 3  \nCódigo 4: 5  \n  ¡Código especial detectado!\n...\n',NULL,4,0,4,700,150,'print(\"Decodificador de Accesos con Secuencia Astro-Fibonacci\\n\")\n\n# Primeros valores\na = 1\nb = 1\n\n# Imprimir los dos primeros códigos\nprint(\"Código 1:\", a)\nprint(\"Código 2:\", b)\n\n# TODO: completar bucle para generar el resto de códigos\n# y detectar los códigos especiales\n','Decodificador de Accesos con Secuencia Astro-Fibonacci\n\nCódigo 1: 1\nCódigo 2: 1\nCódigo 3: 3\nCódigo 4: 5\nCódigo especial detectado!\nCódigo 5: 9\nCódigo 6: 15\nCódigo especial detectado!\nCódigo 7: 25\nCódigo especial detectado!\nCódigo 8: 41\nCódigo 9: 67\nCódigo 10: 109\nCódigo 11: 177\nCódigo 12: 287\nCódigo 13: 465\nCódigo 14: 753\nCódigo 15: 1219\nCódigo 16: 1973\nCódigo 17: 3193\nCódigo 18: 5167\nCódigo 19: 8361\nCódigo 20: 13529\nCódigo 21: 21891\nCódigo 22: 35421\nCódigo 23: 57313\nCódigo 24: 92735\nCódigo especial detectado!\nCódigo 25: 150049\n','Códigos cifrados de la nave con Fibonacci modificado'),(10,4,1,'Misión: Secuencia de Lanzamiento\n\nComo controlador de lanzamiento en AstroCode, debes programar la secuencia de cuenta regresiva para el despegue de la nave espacial.\n\nContexto de la misión:\nCada lanzamiento requiere una secuencia precisa de verificaciones. Tu programa debe generar la secuencia numérica y identificar los sistemas críticos (números pares).\n\nObjetivos:\n- Usa un bucle for para imprimir números del 1 al 10\n- Modifica el programa para mostrar solo números pares\n- Agrega mensajes de verificación de sistemas\n\nSecuencia de verificación:\n- Números 1-10: Verificación general\n- Números pares: Sistemas críticos\n\nLo que se espera que se muestre es: \nVerificación sistema 1\nVerificación sistema 2\nSistema crítico 2 operativo\n\n¡Cada verificación es crucial para un lanzamiento exitoso!',NULL,3,0,1,100,50,'# No elimines esta línea de código\nprint(\"Iniciando secuencia de lanzamiento...\\n\")\n\n# TODO: Imprime los números del 1 al 10 usando un bucle for\n# TODO: Para cada número, muestra: Verificación sistema X\n# TODO: Si el número es par, muestra también: Sistema crítico X operativo\n','Iniciando secuencia de lanzamiento...\nVerificación sistema 1\nVerificación sistema 2\nSistema crítico 2 operativo\nVerificación sistema 3\nVerificación sistema 4\nSistema crítico 4 operativo\nVerificación sistema 5\nVerificación sistema 6\nSistema crítico 6 operativo\nVerificación sistema 7\nVerificación sistema 8\nSistema crítico 8 operativo\nVerificación sistema 9\nVerificación sistema 10\nSistema crítico 10 operativo','Cuenta Regresiva de Lanzamiento'),(11,4,2,'Como explorador espacial de AstroCode, tienes una lista con los nombres de los planetas que ya has explorado. Debes crear un programa que recorra esa lista y muestre cada planeta con su posición en la lista.\n\nObjetivos del ejercicio:\n\nSe proporciona una lista llamada planetas con varios nombres.\n\nUsa un bucle para recorrer la lista y mostrar cada planeta con su número de orden (empezando en 1).\n\nLa salida debe tener el formato:\nPlaneta 1: Mercurio\nPlaneta 2: Venus\n...etc.',NULL,3,0,3,100,50,'print(\"Listado de planetas explorados\")\n\nplanetas = [\"Mercurio\", \"Venus\", \"Tierra\", \"Marte\", \"Júpiter\"]\n\n# TODO: Recorrer la lista y mostrar cada planeta con su posición\n','Listado de planetas explorados\nPlaneta 1: Mercurio\nPlaneta 2: Venus\nPlaneta 3: Tierra\nPlaneta 4: Marte\nPlaneta 5: Júpiter\n','Listado de planetas explorados'),(14,5,2,'Como ingeniero de la misión en AstroCode, tienes una lista con la cantidad de combustible que requiere cada módulo de la nave espacial. Debes calcular el total de combustible necesario, pero solo sumando los módulos que requieren más de 150 litros.\n\nObjetivos del ejercicio:\n\nUsar un bucle para recorrer la lista combustibles.\n\nSumar solo los valores mayores a 150 litros.\n\nMostrar el total con el mensaje:\nCombustible total necesario (sólo módulos > 150 litros): XX litros',NULL,3,0,3,100,50,'print(\"Cálculo del combustible total necesario (con filtro)\\n\")\n\ncombustibles = [150, 200, 340, 125, 400]\n\ntotal = 0\n\n# TODO: Recorrer la lista y sumar sólo los valores mayores a 150\n\n# TODO: Mostrar el resultado con el mensaje adecuado\n','Cálculo del combustible total necesario (con filtro)\n\nCombustible total necesario (sólo módulos > 150 litros): 940 litros\n','Cálculo del combustible total necesario'),(16,6,1,'Comprobación del Traje Espacial\n\nAntes de salir al exterior de la nave, los astronautas deben comprobar si su traje espacial está listo. Tu programa debe solicitar al usuario una respuesta (sí o no) y mostrar un mensaje en consecuencia.\n\nObjetivo del ejercicio:\n\nPedir al usuario que escriba si su traje está listo (sí o no).\n\nSi la respuesta es \"sí\", imprimir:\n	Traje listo. Puedes salir al exterior.\n\nSi la respuesta es \"no\", imprimir:\n	Verifica el sistema de soporte vital antes de salir.',NULL,3,0,2,100,50,'print(\"Comprobación del traje espacial:\")\n\n# TODO: Pide al usuario que indique si su traje está listo (sí o no)\n\n# TODO: Usa una estructura if para mostrar el mensaje adecuado\n','Comprobación del traje espacial:\nTraje listo. Puedes salir al exterior.','Comprobación del Traje Espacial'),(17,6,2,'En AstroCode, debes clasificar a los astronautas en dos grupos según su edad: \"Jóvenes\" (menores de 35 años) y \"Veteranos\" (35 años o más). Luego, imprime cada astronauta con un mensaje que indique su grupo y número en la lista.\n\nObjetivos del ejercicio:\nRecorrer la lista edades.\nPara cada astronauta, imprimir el mensaje:\n- Astronauta joven X: edad si tiene menos de 35 años.\n- Astronauta veterano X: edad si tiene 35 o más.\nEl número X debe ser un contador independiente para cada grupo.\n\nDebería verse así:\nClasificación detallada de astronautas por edad\nAstronauta joven 1: 29\nAstronauta veterano 1: 42\nAstronauta joven 2: 33',NULL,3,0,3,100,50,'print(\"Clasificación detallada de astronautas por edad\")\n\nedades = [29, 42, 33, 37, 25, 40]\n\ncontador_jovenes = 0\ncontador_veteranos = 0\n\n# TODO: Recorrer la lista edades y mostrar el mensaje para cada astronauta\n','Clasificación detallada de astronautas por edad\nAstronauta joven 1: 29\nAstronauta veterano 1: 42\nAstronauta joven 2: 33','Clasificación detallada de astronautas por edad\n'),(18,6,3,'Como responsable de la planificación en AstroCode, debes diseñar un programa que gestione una lista de misiones espaciales, cada una con un nombre, duración en días y recursos necesarios (combustible y tripulación). El programa debe:\n\nPermitir añadir nuevas misiones a la lista.\nCalcular el total de recursos usados en todas las misiones.\nEvaluar cuáles misiones pueden ser realizadas con recursos limitados dados por el usuario.\nMostrar un resumen detallado.\n\nObjetivos del ejercicio:\n\nCrear una lista de misiones, donde cada misión es un diccionario con claves: \"nombre\", \"duracion\", \"combustible\", \"tripulacion\".\nCrear función agregar_mision(lista, mision) para añadir misiones.\nCrear función total_recursos(lista) que calcule total de combustible y tripulación usados.\nCrear función misiones_posibles(lista, max_combustible, max_tripulacion) que devuelva la lista de misiones que caben dentro de esos límites.\nMostrar un resumen con el total y las misiones posibles.\n\nDebe verse así: \nGestión avanzada de misiones espaciales\n\nTotal combustible requerido: 13000\nTotal tripulación requerida: 14\n\nMisiones que pueden realizarse con 8000 combustible y 8 tripulación:\n- Estudio Asteroides\n',NULL,4,0,5,500,150,'print(\"Gestión avanzada de misiones espaciales\\n\")\n\nmisiones = [\n    {\"nombre\": \"Exploración Marte\", \"duracion\": 30, \"combustible\": 5000, \"tripulacion\": 6},\n    {\"nombre\": \"Estudio Asteroides\", \"duracion\": 20, \"combustible\": 3000, \"tripulacion\": 4},\n]\n\ndef agregar_mision(lista, mision):\n    # TODO: Añadir misión a la lista\n    pass\n\ndef total_recursos(lista):\n    # TODO: Calcular total combustible y tripulación\n    pass\n\ndef misiones_posibles(lista, max_combustible, max_tripulacion):\n    # TODO: Devolver lista de misiones que cumplen requisitos\n    pass\n\n# Ejemplo de uso: agregar una misión nueva\n# TODO: Usar agregar_mision para añadir misión\n\n# TODO: Mostrar total recursos\n\n# TODO: Mostrar misiones posibles con límites dados\n','Gestión avanzada de misiones espaciales\n\nTotal combustible requerido: 13000\nTotal tripulación requerida: 14\n\nMisiones que pueden realizarse con 8000 combustible y 8 tripulación:\n- Estudio Asteroides','Gestión avanzada de misiones y recursos'),(19,7,1,'Misión: Registro de Nave Espacial\n\nComo administrador de flota de AstroCode, necesitas registrar los datos de una nueva nave espacial utilizando variables simples.\n\nContexto de la misión:\nLa flota espacial está creciendo. Es tu responsabilidad almacenar correctamente la información de cada nave para llevar un control de su estado antes del despegue.\n\nObjetivos del ejercicio: crea cuatro variables:\nnombre → \"Estrella Polar\"\ntipo → \"Explorador\"\ntripulacion → 5\ncombustible → 750\n\nUsa print() para mostrar este mensaje final (usando las variables):\n\nNave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750',NULL,3,0,2,100,50,'print(\"Registro de nave espacial\\n\")\n\n# TODO: Define las variables nombre, tipo, tripulacion y combustible\n\n# TODO: Imprime el mensaje con los datos de la nave\n','Registro de nave espacial\nNave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750\n','Registro de la Nave Espacial'),(20,7,2,'Como técnico de control en AstroCode, debes crear un programa que:\n\n- Mantenga los niveles de oxígeno de varios módulos.\n- Permita actualizar el nivel de oxígeno de cualquier módulo.\n- Evalúe y clasifique los niveles actuales en \"CRÍTICO\", \"ESTABLE\" o \"ALTO\" según un nivel crítico definido por el usuario.\n- Genere un informe detallado y el total de módulos en estado crítico.\n\nObjetivos del ejercicio:\n\nCrear una lista niveles_oxigeno con porcentajes iniciales.\nCrear una función actualizar_nivel(niveles, modulo, nuevo_nivel) que actualice el nivel de oxígeno del módulo indicado.\n\nCrear una función monitor_oxigeno(niveles, nivel_critico) que:\n\nRecorra los niveles y clasifique cada módulo:\n\n- Menor que nivel_critico: \"CRÍTICO\"\n- Entre nivel_critico y 23.5%: \"ESTABLE\"\n- Mayor a 23.5%: \"ALTO\"\n\nImprima estado y porcentaje de cada módulo.\nDevuelva el número total de módulos críticos.\nUsar las funciones para actualizar algunos niveles y luego mostrar el informe.\n\nDebe verse así:\nMonitor y gestión dinámica de niveles de oxígeno\nMódulo 1: ESTABLE (20.1%)\nMódulo 2: CRÍTICO (17.0%)\nMódulo 3: ESTABLE (19.5%)\nMódulo 4: ALTO (24.0%)\nMódulo 5: CRÍTICO (18.0%)\nMódulo 6: ALTO (25.3%)\nTotal de módulos críticos: 2\n',NULL,3,0,4,200,100,'print(\"Monitor y gestión dinámica de niveles de oxígeno\")\n\nniveles_oxigeno = [20.1, 18.7, 19.5, 24.0, 22.0, 25.3]\n\ndef actualizar_nivel(niveles, modulo, nuevo_nivel):\n    # TODO: Actualizar nivel de oxígeno del módulo indicado\n    pass\n\ndef monitor_oxigeno(niveles, nivel_critico):\n    criticos = 0\n    # TODO: Recorrer niveles, clasificar e imprimir estado\n    # TODO: Contar y devolver módulos críticos\n    pass\n\n# Actualiza algunos niveles (por ejemplo, módulo 2 y módulo 5)\n# TODO: Llamar a actualizar_nivel para modificar niveles\n\nnivel_critico = 19.5\ntotal_criticos = monitor_oxigeno(niveles_oxigeno, nivel_critico)\n\nprint(f\"Total de módulos críticos: {total_criticos}\")\n','Monitor y gestión dinámica de niveles de oxígeno\nMódulo 1: ESTABLE (20.1%)\nMódulo 2: CRÍTICO (17.0%)\nMódulo 3: ESTABLE (19.5%)\nMódulo 4: ALTO (24.0%)\nMódulo 5: CRÍTICO (18.0%)\nMódulo 6: ALTO (25.3%)\nTotal de módulos críticos: 2\n','Monitor y gestión dinámica de niveles de oxígeno\n'),(21,7,3,'En el centro de control de AstroCode has recibido un paquete con múltiples señales de distintas sondas. Estas señales son valores enteros que pueden estar afectados por interferencias.\n\nTu misión:\nFiltrar, clasificar y analizar las señales útiles.\n\nRequisitos de la misión:\nTienes una lista de señales que puede contener enteros positivos y negativos.\nUna señal es válida si es positiva y múltiplo de 3 o 5.\n\nLas señales válidas deben ser:\n\nFiltradas.\nOrdenadas de mayor a menor.\nDespués, recórrelas con un for y muestra una salida con este formato:\n\"Señal X: Y unidades\"\n(donde X es la posición en la lista ordenada y Y es el valor).\n\nAl final, muestra la media aritmética de las señales válidas.',NULL,5,0,5,600,150,'print(\"Clasificación de Señales Interplanetarias\\n\")\n\nlecturas = [12, -3, 7, 15, 5, -20, 30, 4, 9, 22, 45, -1, 8, 6]\n\n# TODO:\n# 1. Filtrar señales válidas (positivas y múltiplo de 3 o 5)\n# 2. Ordenarlas de mayor a menor\n# 3. Mostrar cada señal con su posición\n# 4. Calcular la media de las señales válidas\n','Clasificación de Señales Interplanetarias\n\nSeñal 1: 45 unidades  \nSeñal 2: 30 unidades  \nSeñal 3: 15 unidades  \nSeñal 4: 12 unidades  \nSeñal 5: 9 unidades  \nSeñal 6: 6 unidades  \nSeñal 7: 5 unidades  \n\nMedia de señales válidas: 17.43\n','Detección de Señales Anómalas en AstroCode'),(25,9,1,'Recuento de Satélites\n\nComo operador de comunicaciones de AstroCode, estás haciendo un recuento de satélites en órbita. Ya hay 12 satélites activos y hoy se han lanzado 3 nuevos. La capacidad máxima de la órbita es 15 satélites.\n\nObjetivos del ejercicio:\n\nCrea variables:\nsatelites_activos = 12\nnuevos_satelites = 3\ncapacidad_orbita = 15\n\nCalcula el total de satélites en órbita.\nImprime el mensaje con el total:\nSatélites totales en órbita: X\n\nUsa un if para comprobar si el total es menor o igual que la capacidad.\n\nSi es así, imprime: Orbita con espacio disponible.\nSi no, imprime: Capacidad máxima superada, órbita saturada.',NULL,3,0,2,100,50,'print(\"Recuento de satélites en órbita y capacidad\\n\")\n\nsatelites_activos = 12\nnuevos_satelites = 3\ncapacidad_orbita = 15\n\n# TODO: Calcula el total de satélites\n\n# TODO: Imprime el mensaje con el total de satélites\n\n# TODO: Usa un if para mostrar el mensaje correcto según la capacidad\n','Recuento de satélites en órbita y capacidad\nSatélites totales en órbita: 15\nOrbita con espacio disponible.','Recuento de Satélites'),(28,10,1,'Contraseña Segura de Nave\n\nPara acceder al control de la nave, debes ingresar la contraseña correcta \"ASTROCODE\". El sistema te pide la contraseña 3 veces seguidas, aunque aciertes antes. Al final, te dirá si tu acceso fue concedido o denegado.\n\nObjetivos del ejercicio:\n\n- Usar un bucle que pida la contraseña 3 veces, guardando si alguna vez fue correcta.\n\nEn cada intento, si la contraseña no es correcta, muestra:\n- Contraseña incorrecta. Reintente.\n\nAl final, muestra:\n\nSi acertaste alguna vez:\n- Acceso concedido. Bienvenido al control de la nave.\n\nSi no acertaste ninguna vez:\n- Acceso denegado. Demasiados intentos fallidos.\n\n',NULL,3,0,3,100,50,'print(\"Verificación de contraseña con 3 intentos obligatorios\\n\")\n\nacceso = False\n\nfor intento in range(3):\n    contraseña = input(f\"Intento {intento + 1}: Introduce la contraseña: \")\n    \n    if contraseña == \"ASTROCODE\":\n        acceso = True\n    else:\n        print(\"Contraseña incorrecta. Asegúrate de usar mayúsculas.\")\n\nif acceso:\n    print(\"Acceso concedido. Bienvenido al control de la nave.\")\nelse:\n    print(\"Acceso denegado. Demasiados intentos fallidos.\")\n','Verificación de contraseña con 3 intentos obligatorios\nIntento 1: Introduce la contraseña: astrocod\nContraseña incorrecta. Asegúrate de usar mayúsculas.\nIntento 2: Introduce la contraseña: astrocode\nContraseña incorrecta. Asegúrate de usar mayúsculas.\nIntento 3: Introduce la contraseña: ASTROCODE\nAcceso concedido. Bienvenido al control de la nave.\n','Pila de Comandos de Nave'),(46,16,4,'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.','2025-07-12',5,0,5,1000,0,'class Nodo:\n    def __init__(self, valor):\n        self.valor = valor\n        self.izquierda = None\n        self.derecha = None\n\ndef invertir_arbol(raiz):\n    # Tu código aquí\n    pass','def invertir_arbol(raiz):\n    if raiz is None:\n        return None\n    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)\n    return raiz','Invertir un Árbol Binario'),(47,16,4,'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.','2025-07-13',5,0,5,1000,0,'def es_valido(cadena):\n    # Tu código aquí\n    pass','def es_valido(cadena):\n    pila = []\n    mapa = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in cadena:\n        if char in mapa:\n            elemento_pop = pila.pop() if pila else \"#\"\n            if mapa[char] != elemento_pop:\n                return False\n        else:\n            pila.append(char)\n    return not pila','Validar Paréntesis'),(48,16,4,'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.','2025-07-14',5,0,5,1000,0,'def encontrar_faltante(numeros):\n    # Tu código aquí\n    pass','def encontrar_faltante(numeros):\n    n = len(numeros) + 1\n    suma_esperada = n * (n + 1) // 2\n    suma_real = sum(numeros)\n    return suma_esperada - suma_real','Encontrar el Número Faltante'),(49,16,4,'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.','2025-07-15',5,0,5,1000,0,'class Nodo:\n    def __init__(self, valor):\n        self.valor = valor\n        self.izquierda = None\n        self.derecha = None\n\ndef invertir_arbol(raiz):\n    # Tu código aquí\n    pass','def invertir_arbol(raiz):\n    if raiz is None:\n        return None\n    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)\n    return raiz','Invertir un Árbol Binario'),(50,16,4,'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.','2025-07-16',5,0,5,1000,0,'def es_valido(cadena):\n    # Tu código aquí\n    pass','def es_valido(cadena):\n    pila = []\n    mapa = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in cadena:\n        if char in mapa:\n            elemento_pop = pila.pop() if pila else \"#\"\n            if mapa[char] != elemento_pop:\n                return False\n        else:\n            pila.append(char)\n    return not pila','Validar Paréntesis'),(51,16,4,'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.','2025-07-17',5,0,5,1000,0,'def encontrar_faltante(numeros):\n    # Tu código aquí\n    pass','def encontrar_faltante(numeros):\n    n = len(numeros) + 1\n    suma_esperada = n * (n + 1) // 2\n    suma_real = sum(numeros)\n    return suma_esperada - suma_real','Encontrar el Número Faltante'),(52,16,4,'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.','2025-07-18',5,0,5,1000,0,'class Nodo:\n    def __init__(self, valor):\n        self.valor = valor\n        self.izquierda = None\n        self.derecha = None\n\ndef invertir_arbol(raiz):\n    # Tu código aquí\n    pass','def invertir_arbol(raiz):\n    if raiz is None:\n        return None\n    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)\n    return raiz','Invertir un Árbol Binario'),(53,16,4,'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.','2025-07-19',5,0,5,1000,0,'def es_valido(cadena):\n    # Tu código aquí\n    pass','def es_valido(cadena):\n    pila = []\n    mapa = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in cadena:\n        if char in mapa:\n            elemento_pop = pila.pop() if pila else \"#\"\n            if mapa[char] != elemento_pop:\n                return False\n        else:\n            pila.append(char)\n    return not pila','Validar Paréntesis'),(54,16,4,'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.','2025-07-20',5,0,5,1000,0,'def encontrar_faltante(numeros):\n    # Tu código aquí\n    pass','def encontrar_faltante(numeros):\n    n = len(numeros) + 1\n    suma_esperada = n * (n + 1) // 2\n    suma_real = sum(numeros)\n    return suma_esperada - suma_real','Encontrar el Número Faltante');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas_usuarios`
--

DROP TABLE IF EXISTS `tareas_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas_usuarios` (
  `usuario_id` bigint NOT NULL,
  `tarea_id` bigint NOT NULL,
  `completado_el` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tiempo_completado` time DEFAULT NULL,
  `puntos_base` int DEFAULT NULL,
  `puntos_bonus` int DEFAULT NULL,
  `puntos_totales` int DEFAULT NULL,
  PRIMARY KEY (`usuario_id`,`tarea_id`),
  KEY `tarea_id` (`tarea_id`),
  CONSTRAINT `tareas_usuarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `tareas_usuarios_ibfk_2` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas_usuarios`
--

LOCK TABLES `tareas_usuarios` WRITE;
/*!40000 ALTER TABLE `tareas_usuarios` DISABLE KEYS */;
INSERT INTO `tareas_usuarios` VALUES (1,1,'2025-06-29 20:11:01','00:04:01',50,0,50),(2,1,'2025-06-29 20:11:01','00:04:01',50,0,50),(3,1,'2025-06-29 20:11:01','00:04:01',50,0,50),(130,1,'2025-07-04 08:21:33','00:00:06',50,50,100),(130,2,'2025-07-04 08:19:47','00:00:06',50,50,100),(130,3,'2025-07-04 07:52:18','00:00:08',50,50,100),(130,5,'2025-07-04 08:07:01','00:00:07',50,50,100);
/*!40000 ALTER TABLE `tareas_usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiempos_finalizacion`
--

DROP TABLE IF EXISTS `tiempos_finalizacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiempos_finalizacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `umbral` time NOT NULL,
  `puntos_bonus` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiempos_finalizacion`
--

LOCK TABLES `tiempos_finalizacion` WRITE;
/*!40000 ALTER TABLE `tiempos_finalizacion` DISABLE KEYS */;
INSERT INTO `tiempos_finalizacion` VALUES (1,'00:02:00',100),(2,'00:05:00',75),(3,'00:10:00',50),(4,'00:15:00',25),(5,'00:30:00',10);
/*!40000 ALTER TABLE `tiempos_finalizacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(255) NOT NULL,
  `correo_electronico` varchar(255) NOT NULL,
  `contrasena_hash` text NOT NULL,
  `nombre_completo` varchar(255) DEFAULT NULL,
  `puntos` int DEFAULT '0',
  `creado_el` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  UNIQUE KEY `correo_electronico` (`correo_electronico`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'testuser','test@example.com','$2b$10$pXTcHSWaIMH0vAyF/RrE1uJRNntWoXjYoQQMwzlK1TdFBJNLdkqrK','Usuario de Prueba',120,'2025-06-19 15:28:21'),(2,'michu','michu@gmail.com','$2b$12$v6tYh7cC06jk4iwMPli9ReNTY2SkMc2osr4A4n4z7HZXu9y63z0Am','Miguel Mier',1050,'2025-06-19 15:54:47'),(3,'marinita','marina@gmail.com','$2b$12$ATweMvWUBsN3sv4RWYu.Ku3SMnjvJs9WodYVLXDJ4ZDDUkl.MKRVi','Marina Izquierdo',9999,'2025-06-19 17:47:37'),(4,'merins','m@a.com','$2b$12$.E7UBjM2ul893sq9D0mADOPhkI0oLvdlwkrz1LHWep5Eha8F7JHDW','Marinita',0,'2025-06-19 17:48:40'),(5,'usuario_existente','existente@example.com','$2b$12$7nf1O4e..BVY8t.W8Eh/KuIJ1gN1PBMb3XKTnaIzbvn3bYlCK3z0e','Usuario Existente',0,'2025-07-02 20:29:53'),(6,'usuario_nuevo','nuevo@example.com','$2b$12$XLJEs2BjxTDksfd0p7t1aOARSO4Zsc5/FiNJk92rbuAXrL83c/lie','Usuario Nuevo',0,'2025-07-02 20:29:53'),(127,'pruebina','p@p.com','$2b$12$NAxf1SpnDXjizY1d6Fxqo.0niiXUaxj8J/dC80ZwiCI6rPMNJfLHa','una prueba',0,'2025-07-04 07:44:48'),(128,'holaaa','h@h.com','$2b$12$PmNiVgQbM8ks1IbNOIx1f.fmShlXKDuXdzw97l/MPWcDs7iG9Fq5W','mi mi',0,'2025-07-04 07:45:20'),(129,'yyyy','y@y.com','$2b$12$.yA/JAumqtsTCWowFJm/J.OGus1qh7n9Ax3eAKF.5Yb/EbUwirqTi','yyyyyy',0,'2025-07-04 07:48:15'),(130,'pppp@ppp.com','ppp@ppp.com','$2b$12$HnUnnM2Ipaiah0z3AFaP8OGt/v.EON/JbyaNqMv4KoKagwjjX4/8G','pwefpw efb',1050,'2025-07-04 07:51:27');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-09 17:11:19
