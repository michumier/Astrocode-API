// Fase 7: repaso de los 19 ejercicios de código de los planetas (los de `BD Astrocode.sql`).
// Cada uno conserva su id, su tema, sus datos y sus puntos, pero ahora:
// - el enunciado dice exactamente qué hay que escribir y qué debe salir;
// - el código base es Python válido (antes había cadenas rotas y emojis perdidos: «?»);
// - tiene solución de referencia (la usan AstroTutor y los sabotajes) y tests:
//   uno visible con la salida completa y otros ocultos que llaman a las funciones o miran las
//   variables con otros datos, para que no baste con copiar la salida con print.
// La migración 020 solo toca un ejercicio si su título sigue siendo el original.

export interface TestSemilla {
  descripcion: string;
  // Código que se añade tras el del alumno; vacío = se compara la salida completa del programa
  codigo: string;
  salida: string;
  oculto?: boolean;
}

export interface EjercicioRevisado {
  id: number;
  tituloAntes: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  codigoBase: string;
  resultadoEsperado: string;
  solucion: string;
  tests: TestSemilla[];
}

// Test visible con la salida completa del programa
const salidaCompleta = (salida: string): TestSemilla => ({ descripcion: 'Salida completa del programa', codigo: '', salida });

export const ejerciciosRevisados: EjercicioRevisado[] = [
  // ───────────── Nivel 1 · Fácil ─────────────
  {
    id: 1,
    tituloAntes: 'Variables Espaciales Básicas',
    titulo: 'Variables espaciales básicas',
    categoria: 'Variables y Tipos',
    descripcion: `Acabas de llegar a la estación AstroCode-1 y tu primera tarea es registrar al comandante en el ordenador de a bordo.

Objetivos:
- Crea una variable llamada \`edad\` con el número entero \`25\`.
- No cambies los \`print\`: ya usan tu variable para mostrar el registro.`,
    codigoBase: `print("=== REGISTRO DE COMANDANTE ESPACIAL ===")

# TODO: crea la variable edad con el valor 25

print(f"Edad del comandante: {edad} años terrestres")
print("Comandante registrado. ¡Listo para el despegue!")
`,
    resultadoEsperado: `=== REGISTRO DE COMANDANTE ESPACIAL ===
Edad del comandante: 25 años terrestres
Comandante registrado. ¡Listo para el despegue!`,
    solucion: `print("=== REGISTRO DE COMANDANTE ESPACIAL ===")

edad = 25

print(f"Edad del comandante: {edad} años terrestres")
print("Comandante registrado. ¡Listo para el despegue!")
`,
    tests: [
      salidaCompleta(`=== REGISTRO DE COMANDANTE ESPACIAL ===
Edad del comandante: 25 años terrestres
Comandante registrado. ¡Listo para el despegue!`),
      { descripcion: 'La variable edad es el entero 25', codigo: 'print(edad, type(edad).__name__)', salida: '25 int', oculto: true },
    ],
  },
  {
    id: 4,
    tituloAntes: 'Operaciones Matemáticas Galácticas',
    titulo: 'Calculadora de combustible',
    categoria: 'Operadores',
    descripcion: `La nave va a hacer 3 maniobras y en cada una gasta combustible al acelerar y al frenar. Calcula cuánto quedará en el depósito.

Datos (ya están en el código):
- Combustible inicial: 1000 litros
- Consumo por aceleración: 150 litros
- Consumo por frenado: 75 litros
- Número de maniobras: 3

Objetivos:
- \`por_maniobra\`: lo que se gasta en una maniobra (aceleración + frenado).
- \`total\`: lo que se gasta en todas las maniobras.
- \`restante\`: lo que queda en el depósito.
- \`porcentaje\`: qué porcentaje del combustible inicial queda (usa \`/\` y multiplica por 100).

Usa los operadores \`+\`, \`-\`, \`*\` y \`/\` con las variables de los datos. Los \`print\` ya están escritos.`,
    codigoBase: `print("=== CALCULADORA DE COMBUSTIBLE ===")

combustible_inicial = 1000
consumo_aceleracion = 150
consumo_frenado = 75
maniobras = 3

# TODO: calcula por_maniobra, total, restante y porcentaje
por_maniobra = 0
total = 0
restante = 0
porcentaje = 0

print(f"Consumo por maniobra: {por_maniobra} litros")
print(f"Consumo total de la misión: {total} litros")
print(f"Combustible restante: {restante} litros")
print(f"Porcentaje restante: {porcentaje}%")
`,
    resultadoEsperado: `=== CALCULADORA DE COMBUSTIBLE ===
Consumo por maniobra: 225 litros
Consumo total de la misión: 675 litros
Combustible restante: 325 litros
Porcentaje restante: 32.5%`,
    solucion: `print("=== CALCULADORA DE COMBUSTIBLE ===")

combustible_inicial = 1000
consumo_aceleracion = 150
consumo_frenado = 75
maniobras = 3

por_maniobra = consumo_aceleracion + consumo_frenado
total = por_maniobra * maniobras
restante = combustible_inicial - total
porcentaje = restante / combustible_inicial * 100

print(f"Consumo por maniobra: {por_maniobra} litros")
print(f"Consumo total de la misión: {total} litros")
print(f"Combustible restante: {restante} litros")
print(f"Porcentaje restante: {porcentaje}%")
`,
    tests: [
      salidaCompleta(`=== CALCULADORA DE COMBUSTIBLE ===
Consumo por maniobra: 225 litros
Consumo total de la misión: 675 litros
Combustible restante: 325 litros
Porcentaje restante: 32.5%`),
      { descripcion: 'Las cuatro variables tienen el valor correcto', codigo: 'print(por_maniobra, total, restante, porcentaje)', salida: '225 675 325 32.5', oculto: true },
    ],
  },
  {
    id: 10,
    tituloAntes: 'Cuenta Regresiva de Lanzamiento',
    titulo: 'Verificación antes del lanzamiento',
    categoria: 'Bucles',
    descripcion: `Antes de despegar hay que verificar los 10 sistemas de la nave, uno detrás de otro. Los sistemas con número par son críticos y necesitan una confirmación extra.

Objetivos:
- Recorre los sistemas del 1 al 10 con un bucle \`for\` y \`range\`.
- Para cada sistema, imprime \`Verificación sistema X\`.
- Si el número es par, imprime justo después \`Sistema crítico X operativo\`.
- El mensaje final ya está escrito: tu bucle va antes de él.`,
    codigoBase: `print("Iniciando secuencia de lanzamiento...")

# TODO: recorre los sistemas del 1 al 10 con un bucle for
# TODO: si el número es par, avisa de que el sistema crítico está operativo

print("Todos los sistemas verificados")
`,
    resultadoEsperado: `Iniciando secuencia de lanzamiento...
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
Sistema crítico 10 operativo
Todos los sistemas verificados`,
    solucion: `print("Iniciando secuencia de lanzamiento...")

for sistema in range(1, 11):
    print(f"Verificación sistema {sistema}")
    if sistema % 2 == 0:
        print(f"Sistema crítico {sistema} operativo")

print("Todos los sistemas verificados")
`,
    tests: [
      salidaCompleta(`Iniciando secuencia de lanzamiento...
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
Sistema crítico 10 operativo
Todos los sistemas verificados`),
    ],
  },
  {
    id: 16,
    tituloAntes: 'Comprobación del Traje Espacial',
    titulo: 'Comprobación del traje espacial',
    categoria: 'Estructuras Condicionales',
    descripcion: `Antes de salir al exterior, cada astronauta responde si su traje está listo. Escribe la función que decide qué mensaje mostrar.

Objetivos:
- Completa la función \`comprobar_traje(respuesta)\`.
- Si la respuesta es \`"sí"\`, devuelve \`"Traje listo. Puedes salir al exterior."\`
- Con cualquier otra respuesta, devuelve \`"Verifica el sistema de soporte vital antes de salir."\`
- La respuesta puede llegar en mayúsculas o con espacios alrededor (por ejemplo \`" SÍ "\`): límpiala con \`.strip()\` y \`.lower()\` antes de comparar.`,
    codigoBase: `print("Comprobación del traje espacial")

def comprobar_traje(respuesta):
    # TODO: devuelve el mensaje adecuado según la respuesta
    pass

print(comprobar_traje("sí"))
print(comprobar_traje("no"))
print(comprobar_traje(" SÍ "))
`,
    resultadoEsperado: `Comprobación del traje espacial
Traje listo. Puedes salir al exterior.
Verifica el sistema de soporte vital antes de salir.
Traje listo. Puedes salir al exterior.`,
    solucion: `print("Comprobación del traje espacial")

def comprobar_traje(respuesta):
    if respuesta.strip().lower() == "sí":
        return "Traje listo. Puedes salir al exterior."
    return "Verifica el sistema de soporte vital antes de salir."

print(comprobar_traje("sí"))
print(comprobar_traje("no"))
print(comprobar_traje(" SÍ "))
`,
    tests: [
      salidaCompleta(`Comprobación del traje espacial
Traje listo. Puedes salir al exterior.
Verifica el sistema de soporte vital antes de salir.
Traje listo. Puedes salir al exterior.`),
      { descripcion: 'Respuesta «Sí»', codigo: 'print(comprobar_traje("Sí"))', salida: 'Traje listo. Puedes salir al exterior.', oculto: true },
      { descripcion: 'Respuesta «no lo sé»', codigo: 'print(comprobar_traje("no lo sé"))', salida: 'Verifica el sistema de soporte vital antes de salir.', oculto: true },
    ],
  },
  {
    id: 19,
    tituloAntes: 'Registro de la Nave Espacial',
    titulo: 'Registro de la nave espacial',
    categoria: 'Variables y Tipos',
    descripcion: `La flota de AstroCode crece y cada nave nueva tiene que quedar registrada antes de despegar.

Objetivos:
- Crea estas cuatro variables:
- \`nombre\` con el texto \`"Estrella Polar"\`
- \`tipo\` con el texto \`"Explorador"\`
- \`tripulacion\` con el número \`5\`
- \`combustible\` con el número \`750\`
- Muestra el registro con un solo \`print\` que use las variables (una f-string), exactamente así:

\`Nave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750\``,
    codigoBase: `print("Registro de nave espacial")

# TODO: define las variables nombre, tipo, tripulacion y combustible

# TODO: imprime el registro de la nave usando las variables
`,
    resultadoEsperado: `Registro de nave espacial
Nave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750`,
    solucion: `print("Registro de nave espacial")

nombre = "Estrella Polar"
tipo = "Explorador"
tripulacion = 5
combustible = 750

print(f"Nave {nombre} ({tipo}) — Tripulación: {tripulacion} — Combustible: {combustible}")
`,
    tests: [
      salidaCompleta(`Registro de nave espacial
Nave Estrella Polar (Explorador) — Tripulación: 5 — Combustible: 750`),
      { descripcion: 'Las cuatro variables existen con su valor', codigo: 'print(nombre, tipo, tripulacion, combustible)', salida: 'Estrella Polar Explorador 5 750', oculto: true },
    ],
  },
  {
    id: 25,
    tituloAntes: 'Recuento de Satélites',
    titulo: 'Recuento de satélites',
    categoria: 'Estructuras Condicionales',
    descripcion: `Como operador de comunicaciones haces el recuento de satélites en órbita. Ya hay 12 activos y hoy se han lanzado 3 nuevos. La órbita admite como mucho 15.

Objetivos:
- Guarda en \`total_satelites\` la suma de los activos y los nuevos.
- Imprime \`Satélites totales en órbita: X\`.
- Con un \`if\`, comprueba si el total es menor o igual que la capacidad:
- si lo es, imprime \`Órbita con espacio disponible.\`
- si no, imprime \`Capacidad máxima superada, órbita saturada.\``,
    codigoBase: `print("Recuento de satélites en órbita")

satelites_activos = 12
nuevos_satelites = 3
capacidad_orbita = 15

# TODO: calcula total_satelites

# TODO: imprime el total de satélites

# TODO: usa un if para mostrar si queda espacio en la órbita
`,
    resultadoEsperado: `Recuento de satélites en órbita
Satélites totales en órbita: 15
Órbita con espacio disponible.`,
    solucion: `print("Recuento de satélites en órbita")

satelites_activos = 12
nuevos_satelites = 3
capacidad_orbita = 15

total_satelites = satelites_activos + nuevos_satelites

print(f"Satélites totales en órbita: {total_satelites}")

if total_satelites <= capacidad_orbita:
    print("Órbita con espacio disponible.")
else:
    print("Capacidad máxima superada, órbita saturada.")
`,
    tests: [
      salidaCompleta(`Recuento de satélites en órbita
Satélites totales en órbita: 15
Órbita con espacio disponible.`),
      { descripcion: 'total_satelites vale 15', codigo: 'print(total_satelites)', salida: '15', oculto: true },
    ],
  },
  {
    id: 28,
    tituloAntes: 'Pila de Comandos de Nave',
    titulo: 'Contraseña de la nave',
    categoria: 'Bucles',
    descripcion: `Para entrar al control de la nave hay que escribir la contraseña \`ASTROCODE\`. El sistema siempre pide 3 intentos, aunque aciertes antes, y al final dice si concede el acceso.

Objetivos:
- Completa \`verificar_acceso(intentos)\`, que recibe una lista con las 3 contraseñas escritas.
- Recórrela con un bucle. Por cada contraseña incorrecta, imprime \`Contraseña incorrecta. Asegúrate de usar mayúsculas.\`
- Guarda en \`acceso\` si alguna fue correcta.
- Al final, devuelve \`"Acceso concedido. Bienvenido al control de la nave."\` si alguna lo fue, o \`"Acceso denegado. Demasiados intentos fallidos."\` si no.`,
    codigoBase: `print("Verificación de contraseña con 3 intentos")

def verificar_acceso(intentos):
    acceso = False
    # TODO: recorre los intentos y avisa de cada contraseña incorrecta
    # TODO: devuelve el mensaje final según si alguna fue correcta
    pass

print(verificar_acceso(["astrocod", "astrocode", "ASTROCODE"]))
print(verificar_acceso(["1234", "nave", "Astrocode"]))
`,
    resultadoEsperado: `Verificación de contraseña con 3 intentos
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Acceso concedido. Bienvenido al control de la nave.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Acceso denegado. Demasiados intentos fallidos.`,
    solucion: `print("Verificación de contraseña con 3 intentos")

def verificar_acceso(intentos):
    acceso = False
    for contrasena in intentos:
        if contrasena == "ASTROCODE":
            acceso = True
        else:
            print("Contraseña incorrecta. Asegúrate de usar mayúsculas.")
    if acceso:
        return "Acceso concedido. Bienvenido al control de la nave."
    return "Acceso denegado. Demasiados intentos fallidos."

print(verificar_acceso(["astrocod", "astrocode", "ASTROCODE"]))
print(verificar_acceso(["1234", "nave", "Astrocode"]))
`,
    tests: [
      salidaCompleta(`Verificación de contraseña con 3 intentos
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Acceso concedido. Bienvenido al control de la nave.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Acceso denegado. Demasiados intentos fallidos.`),
      {
        descripcion: 'Acierta a la primera y sigue pidiendo',
        codigo: 'print(verificar_acceso(["ASTROCODE", "x", "y"]))',
        salida: `Contraseña incorrecta. Asegúrate de usar mayúsculas.
Contraseña incorrecta. Asegúrate de usar mayúsculas.
Acceso concedido. Bienvenido al control de la nave.`,
        oculto: true,
      },
    ],
  },

  // ───────────── Nivel 2 · Intermedio ─────────────
  {
    id: 2,
    tituloAntes: 'Sistema de Tipos Avanzado Espacial',
    titulo: 'Telemetría: conversión de tipos',
    categoria: 'Variables y Tipos',
    descripcion: `Los sensores de la nave envían cada dato en un tipo distinto y el ordenador central los necesita convertidos.

Datos (ya están en el código):
- \`velocidad = "2500"\` (texto)
- \`temperatura = 98.6\` (decimal)
- \`coordenada_x = 42\` (entero)
- \`sistema_activo = 1\` (entero)

Objetivos:
- \`velocidad_num\`: la velocidad convertida a entero con \`int()\`.
- \`temperatura_int\`: la temperatura convertida a entero (se queda la parte entera).
- \`coordenada_txt\`: la coordenada convertida a texto con \`str()\`.
- \`activo\`: el sistema convertido a booleano con \`bool()\`.

Los \`print\` ya muestran cada valor con su tipo. Fíjate en la última línea: solo sale bien si la velocidad es un número.`,
    codigoBase: `print("=== SISTEMA DE TELEMETRÍA ===")

velocidad = "2500"
temperatura = 98.6
coordenada_x = 42
sistema_activo = 1

# TODO: haz las cuatro conversiones
velocidad_num = velocidad
temperatura_int = temperatura
coordenada_txt = coordenada_x
activo = sistema_activo

print(f"Velocidad: {velocidad_num} ({type(velocidad_num).__name__})")
print(f"Temperatura: {temperatura_int} ({type(temperatura_int).__name__})")
print(f"Coordenada X: {coordenada_txt!r} ({type(coordenada_txt).__name__})")
print(f"Sistema activo: {activo} ({type(activo).__name__})")
print(f"Distancia recorrida en 2 horas: {velocidad_num * 2} km")
`,
    resultadoEsperado: `=== SISTEMA DE TELEMETRÍA ===
Velocidad: 2500 (int)
Temperatura: 98 (int)
Coordenada X: '42' (str)
Sistema activo: True (bool)
Distancia recorrida en 2 horas: 5000 km`,
    solucion: `print("=== SISTEMA DE TELEMETRÍA ===")

velocidad = "2500"
temperatura = 98.6
coordenada_x = 42
sistema_activo = 1

velocidad_num = int(velocidad)
temperatura_int = int(temperatura)
coordenada_txt = str(coordenada_x)
activo = bool(sistema_activo)

print(f"Velocidad: {velocidad_num} ({type(velocidad_num).__name__})")
print(f"Temperatura: {temperatura_int} ({type(temperatura_int).__name__})")
print(f"Coordenada X: {coordenada_txt!r} ({type(coordenada_txt).__name__})")
print(f"Sistema activo: {activo} ({type(activo).__name__})")
print(f"Distancia recorrida en 2 horas: {velocidad_num * 2} km")
`,
    tests: [
      salidaCompleta(`=== SISTEMA DE TELEMETRÍA ===
Velocidad: 2500 (int)
Temperatura: 98 (int)
Coordenada X: '42' (str)
Sistema activo: True (bool)
Distancia recorrida en 2 horas: 5000 km`),
      {
        descripcion: 'Las conversiones tienen el tipo y el valor correctos',
        codigo: 'print(repr(velocidad_num), repr(temperatura_int), repr(coordenada_txt), repr(activo))',
        salida: "2500 98 '42' True",
        oculto: true,
      },
    ],
  },
  {
    id: 5,
    tituloAntes: 'Gestión de misiones espaciales',
    titulo: 'Gestión de misiones espaciales',
    categoria: 'Funciones',
    descripcion: `Como coordinador de misiones llevas la lista de misiones pendientes. Completa las dos funciones que la gestionan.

Objetivos:
- \`agregar_mision(mision)\`: añade la misión a la lista \`misiones\` con \`.append()\` e imprime \`Misión añadida: <misión>\`.
- \`mostrar_misiones()\`: imprime \`Lista actual de misiones:\` y después cada misión numerada desde 1, por ejemplo \`1. Explorar Marte\` (puedes usar \`enumerate(misiones, start=1)\`).
- Las llamadas ya están escritas al final del código.`,
    codigoBase: `print("Gestión de misiones espaciales")

misiones = []

def agregar_mision(mision):
    # TODO: añade la misión a la lista y avisa de que se ha añadido
    pass

def mostrar_misiones():
    # TODO: muestra el título de la lista y cada misión numerada
    pass

agregar_mision("Explorar Marte")
agregar_mision("Reparar satélite")
agregar_mision("Establecer base lunar")

mostrar_misiones()
`,
    resultadoEsperado: `Gestión de misiones espaciales
Misión añadida: Explorar Marte
Misión añadida: Reparar satélite
Misión añadida: Establecer base lunar
Lista actual de misiones:
1. Explorar Marte
2. Reparar satélite
3. Establecer base lunar`,
    solucion: `print("Gestión de misiones espaciales")

misiones = []

def agregar_mision(mision):
    misiones.append(mision)
    print(f"Misión añadida: {mision}")

def mostrar_misiones():
    print("Lista actual de misiones:")
    for numero, mision in enumerate(misiones, start=1):
        print(f"{numero}. {mision}")

agregar_mision("Explorar Marte")
agregar_mision("Reparar satélite")
agregar_mision("Establecer base lunar")

mostrar_misiones()
`,
    tests: [
      salidaCompleta(`Gestión de misiones espaciales
Misión añadida: Explorar Marte
Misión añadida: Reparar satélite
Misión añadida: Establecer base lunar
Lista actual de misiones:
1. Explorar Marte
2. Reparar satélite
3. Establecer base lunar`),
      {
        descripcion: 'Con otra lista de misiones',
        codigo: 'misiones.clear()\nagregar_mision("Rescatar la sonda")\nmostrar_misiones()',
        salida: `Misión añadida: Rescatar la sonda
Lista actual de misiones:
1. Rescatar la sonda`,
        oculto: true,
      },
    ],
  },
  {
    id: 8,
    tituloAntes: 'Estado del sistema de soporte vital',
    titulo: 'Estado del sistema de soporte vital',
    categoria: 'Estructuras Condicionales',
    descripcion: `Como ingeniero de sistemas tienes que avisar cuando el soporte vital se sale de sus márgenes de seguridad.

Objetivos:
- Completa \`evaluar_sistema(oxigeno, presion, temperatura)\`.
- Si el oxígeno está entre 19.5 y 23.5, la presión entre 98 y 102 y la temperatura entre 18 y 27 (los extremos cuentan), devuelve \`"Sistema estable. Condiciones óptimas."\`
- Si cualquiera se sale de su rango, devuelve \`"Alerta: Parámetros fuera de rango. Revisión necesaria."\`
- Las pruebas del final ya están escritas.`,
    codigoBase: `print("Evaluación del sistema de soporte vital")

def evaluar_sistema(oxigeno, presion, temperatura):
    # TODO: devuelve el mensaje según los rangos de seguridad
    pass

print(evaluar_sistema(21, 100, 22))   # Condiciones óptimas
print(evaluar_sistema(18, 100, 22))   # Oxígeno bajo
print(evaluar_sistema(21, 105, 22))   # Presión alta
print(evaluar_sistema(21, 100, 30))   # Temperatura alta
`,
    resultadoEsperado: `Evaluación del sistema de soporte vital
Sistema estable. Condiciones óptimas.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.`,
    solucion: `print("Evaluación del sistema de soporte vital")

def evaluar_sistema(oxigeno, presion, temperatura):
    if 19.5 <= oxigeno <= 23.5 and 98 <= presion <= 102 and 18 <= temperatura <= 27:
        return "Sistema estable. Condiciones óptimas."
    return "Alerta: Parámetros fuera de rango. Revisión necesaria."

print(evaluar_sistema(21, 100, 22))   # Condiciones óptimas
print(evaluar_sistema(18, 100, 22))   # Oxígeno bajo
print(evaluar_sistema(21, 105, 22))   # Presión alta
print(evaluar_sistema(21, 100, 30))   # Temperatura alta
`,
    tests: [
      salidaCompleta(`Evaluación del sistema de soporte vital
Sistema estable. Condiciones óptimas.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.
Alerta: Parámetros fuera de rango. Revisión necesaria.`),
      { descripcion: 'Justo en los mínimos', codigo: 'print(evaluar_sistema(19.5, 98, 18))', salida: 'Sistema estable. Condiciones óptimas.', oculto: true },
      { descripcion: 'Justo en los máximos', codigo: 'print(evaluar_sistema(23.5, 102, 27))', salida: 'Sistema estable. Condiciones óptimas.', oculto: true },
      { descripcion: 'Oxígeno apenas por encima', codigo: 'print(evaluar_sistema(23.6, 100, 22))', salida: 'Alerta: Parámetros fuera de rango. Revisión necesaria.', oculto: true },
    ],
  },
  {
    id: 11,
    tituloAntes: 'Listado de planetas explorados',
    titulo: 'Listado de planetas explorados',
    categoria: 'Bucles',
    descripcion: `Tienes la lista de los planetas que ya has explorado y quieres mostrarla numerada.

Objetivos:
- Recorre la lista \`planetas\` con un bucle.
- Para cada planeta, imprime \`Planeta N: <nombre>\`, empezando a contar en 1.
- Pista: \`enumerate(planetas, start=1)\` te da la posición y el nombre a la vez.`,
    codigoBase: `print("Listado de planetas explorados")

planetas = ["Mercurio", "Venus", "Tierra", "Marte", "Júpiter"]

# TODO: recorre la lista y muestra cada planeta con su posición
`,
    resultadoEsperado: `Listado de planetas explorados
Planeta 1: Mercurio
Planeta 2: Venus
Planeta 3: Tierra
Planeta 4: Marte
Planeta 5: Júpiter`,
    solucion: `print("Listado de planetas explorados")

planetas = ["Mercurio", "Venus", "Tierra", "Marte", "Júpiter"]

for posicion, planeta in enumerate(planetas, start=1):
    print(f"Planeta {posicion}: {planeta}")
`,
    tests: [
      salidaCompleta(`Listado de planetas explorados
Planeta 1: Mercurio
Planeta 2: Venus
Planeta 3: Tierra
Planeta 4: Marte
Planeta 5: Júpiter`),
    ],
  },
  {
    id: 14,
    tituloAntes: 'Cálculo del combustible total necesario',
    titulo: 'Cálculo del combustible necesario',
    categoria: 'Bucles',
    descripcion: `Cada módulo de la nave necesita una cantidad de combustible. Solo hay que repostar los módulos que necesitan más de 150 litros.

Objetivos:
- Recorre la lista \`combustibles\` con un bucle.
- Suma en \`total\` solo los valores mayores que 150 (150 justo no cuenta).
- Imprime \`Combustible necesario (módulos de más de 150 litros): X litros\`.`,
    codigoBase: `print("Cálculo del combustible necesario")

combustibles = [150, 200, 340, 125, 400]

total = 0

# TODO: recorre la lista y suma solo los valores mayores que 150

# TODO: muestra el total con el mensaje del enunciado
`,
    resultadoEsperado: `Cálculo del combustible necesario
Combustible necesario (módulos de más de 150 litros): 940 litros`,
    solucion: `print("Cálculo del combustible necesario")

combustibles = [150, 200, 340, 125, 400]

total = 0

for litros in combustibles:
    if litros > 150:
        total += litros

print(f"Combustible necesario (módulos de más de 150 litros): {total} litros")
`,
    tests: [
      salidaCompleta(`Cálculo del combustible necesario
Combustible necesario (módulos de más de 150 litros): 940 litros`),
      { descripcion: 'total vale 940', codigo: 'print(total)', salida: '940', oculto: true },
    ],
  },
  {
    id: 17,
    tituloAntes: 'Clasificación detallada de astronautas por edad',
    titulo: 'Clasificación de astronautas por edad',
    categoria: 'Arrays y Listas',
    descripcion: `Hay que repartir a los astronautas en dos grupos según su edad: jóvenes (menos de 35 años) y veteranos (35 o más). Cada grupo lleva su propio contador.

Objetivos:
- Recorre la lista \`edades\` en orden.
- Si la edad es menor que 35, suma 1 a \`contador_jovenes\` e imprime \`Astronauta joven N: <edad>\`.
- Si no, suma 1 a \`contador_veteranos\` e imprime \`Astronauta veterano N: <edad>\`.
- \`N\` es el contador del grupo en ese momento (empieza en 1 en cada grupo).`,
    codigoBase: `print("Clasificación de astronautas por edad")

edades = [29, 42, 33, 37, 25, 40]

contador_jovenes = 0
contador_veteranos = 0

# TODO: recorre las edades, actualiza el contador de su grupo y muestra el mensaje
`,
    resultadoEsperado: `Clasificación de astronautas por edad
Astronauta joven 1: 29
Astronauta veterano 1: 42
Astronauta joven 2: 33
Astronauta veterano 2: 37
Astronauta joven 3: 25
Astronauta veterano 3: 40`,
    solucion: `print("Clasificación de astronautas por edad")

edades = [29, 42, 33, 37, 25, 40]

contador_jovenes = 0
contador_veteranos = 0

for edad in edades:
    if edad < 35:
        contador_jovenes += 1
        print(f"Astronauta joven {contador_jovenes}: {edad}")
    else:
        contador_veteranos += 1
        print(f"Astronauta veterano {contador_veteranos}: {edad}")
`,
    tests: [
      salidaCompleta(`Clasificación de astronautas por edad
Astronauta joven 1: 29
Astronauta veterano 1: 42
Astronauta joven 2: 33
Astronauta veterano 2: 37
Astronauta joven 3: 25
Astronauta veterano 3: 40`),
      { descripcion: 'Los contadores acaban en 3 y 3', codigo: 'print(contador_jovenes, contador_veteranos)', salida: '3 3', oculto: true },
    ],
  },
  {
    id: 20,
    tituloAntes: 'Monitor y gestión dinámica de niveles de oxígeno',
    titulo: 'Monitor de oxígeno',
    categoria: 'Funciones',
    descripcion: `Como técnico de control vigilas el oxígeno de los 6 módulos de la estación. Algunos sensores se han recalibrado y hay que actualizar sus valores antes de sacar el informe.

Objetivos:
- \`actualizar_nivel(niveles, modulo, nuevo_nivel)\`: cambia el nivel del módulo indicado. Los módulos se cuentan desde 1, así que el módulo 1 es \`niveles[0]\`.
- Usa esa función para poner el módulo 2 a \`17.0\` y el módulo 5 a \`18.0\`.
- \`monitor_oxigeno(niveles, nivel_critico)\`: recorre los niveles, imprime cada módulo como \`Módulo N: ESTADO (nivel%)\` y devuelve cuántos son críticos. El estado es:
- \`CRÍTICO\` si el nivel es menor que \`nivel_critico\`
- \`ESTABLE\` si está entre \`nivel_critico\` y 23.5 (los dos incluidos)
- \`ALTO\` si es mayor que 23.5`,
    codigoBase: `print("Monitor de niveles de oxígeno")

niveles_oxigeno = [20.1, 18.7, 19.5, 24.0, 22.0, 25.3]

def actualizar_nivel(niveles, modulo, nuevo_nivel):
    # TODO: cambia el nivel del módulo indicado (los módulos empiezan en 1)
    pass

def monitor_oxigeno(niveles, nivel_critico):
    criticos = 0
    # TODO: clasifica e imprime cada módulo y cuenta los críticos
    return criticos

# TODO: pon el módulo 2 a 17.0 y el módulo 5 a 18.0 con actualizar_nivel

nivel_critico = 19.5
total_criticos = monitor_oxigeno(niveles_oxigeno, nivel_critico)

print(f"Total de módulos críticos: {total_criticos}")
`,
    resultadoEsperado: `Monitor de niveles de oxígeno
Módulo 1: ESTABLE (20.1%)
Módulo 2: CRÍTICO (17.0%)
Módulo 3: ESTABLE (19.5%)
Módulo 4: ALTO (24.0%)
Módulo 5: CRÍTICO (18.0%)
Módulo 6: ALTO (25.3%)
Total de módulos críticos: 2`,
    solucion: `print("Monitor de niveles de oxígeno")

niveles_oxigeno = [20.1, 18.7, 19.5, 24.0, 22.0, 25.3]

def actualizar_nivel(niveles, modulo, nuevo_nivel):
    niveles[modulo - 1] = nuevo_nivel

def monitor_oxigeno(niveles, nivel_critico):
    criticos = 0
    for numero, nivel in enumerate(niveles, start=1):
        if nivel < nivel_critico:
            estado = "CRÍTICO"
            criticos += 1
        elif nivel <= 23.5:
            estado = "ESTABLE"
        else:
            estado = "ALTO"
        print(f"Módulo {numero}: {estado} ({nivel}%)")
    return criticos

actualizar_nivel(niveles_oxigeno, 2, 17.0)
actualizar_nivel(niveles_oxigeno, 5, 18.0)

nivel_critico = 19.5
total_criticos = monitor_oxigeno(niveles_oxigeno, nivel_critico)

print(f"Total de módulos críticos: {total_criticos}")
`,
    tests: [
      salidaCompleta(`Monitor de niveles de oxígeno
Módulo 1: ESTABLE (20.1%)
Módulo 2: CRÍTICO (17.0%)
Módulo 3: ESTABLE (19.5%)
Módulo 4: ALTO (24.0%)
Módulo 5: CRÍTICO (18.0%)
Módulo 6: ALTO (25.3%)
Total de módulos críticos: 2`),
      {
        descripcion: 'Clasifica bien los límites',
        codigo: 'print(monitor_oxigeno([19.4, 19.5, 23.5, 23.6], 19.5))',
        salida: `Módulo 1: CRÍTICO (19.4%)
Módulo 2: ESTABLE (19.5%)
Módulo 3: ESTABLE (23.5%)
Módulo 4: ALTO (23.6%)
1`,
        oculto: true,
      },
      { descripcion: 'actualizar_nivel cuenta los módulos desde 1', codigo: 'n = [1.0, 2.0, 3.0]\nactualizar_nivel(n, 3, 9.5)\nprint(n)', salida: '[1.0, 2.0, 9.5]', oculto: true },
    ],
  },

  // ───────────── Nivel 3 · Difícil ─────────────
  {
    id: 3,
    tituloAntes: 'Ordenar las distancias de planetas',
    titulo: 'Ordenar las distancias de planetas',
    categoria: 'Algoritmos de Ordenamiento',
    descripcion: `Tienes las distancias (en millones de kilómetros) a varios planetas y el sistema de navegación las necesita en un orden especial.

Objetivos:
- Completa \`ordenar_distancias(distancias)\`.
- Separa las distancias que son múltiplo de 3 de las demás.
- Ordena cada grupo de menor a mayor.
- Devuelve una lista nueva con los múltiplos de 3 primero y después el resto.
- El \`print\` del final ya muestra la lista: no hace falta formatearla.`,
    codigoBase: `print("Ordenación especial de distancias planetarias")

distancias = [58, 108, 149, 227, 384, 778, 1430, 2870, 4500]

def ordenar_distancias(distancias):
    # TODO: separa los múltiplos de 3 y los demás
    # TODO: ordena los dos grupos y devuélvelos juntos
    pass

print(ordenar_distancias(distancias))
`,
    resultadoEsperado: `Ordenación especial de distancias planetarias
[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]`,
    solucion: `print("Ordenación especial de distancias planetarias")

distancias = [58, 108, 149, 227, 384, 778, 1430, 2870, 4500]

def ordenar_distancias(distancias):
    multiplos = sorted(d for d in distancias if d % 3 == 0)
    resto = sorted(d for d in distancias if d % 3 != 0)
    return multiplos + resto

print(ordenar_distancias(distancias))
`,
    tests: [
      salidaCompleta(`Ordenación especial de distancias planetarias
[108, 384, 4500, 58, 149, 227, 778, 1430, 2870]`),
      { descripcion: 'Lista desordenada', codigo: 'print(ordenar_distancias([9, 1, 6, 4, 3]))', salida: '[3, 6, 9, 1, 4]', oculto: true },
      { descripcion: 'Sin múltiplos de 3', codigo: 'print(ordenar_distancias([10, 5]))', salida: '[5, 10]', oculto: true },
      { descripcion: 'Lista vacía', codigo: 'print(ordenar_distancias([]))', salida: '[]', oculto: true },
    ],
  },
  {
    id: 6,
    tituloAntes: 'Matriz de módulos y verificación de estado',
    titulo: 'Matriz de sensores de los módulos',
    categoria: 'Arrays y Listas',
    descripcion: `Tienes una matriz con el estado de los sensores de la nave: cada fila es un módulo y cada columna un sensor.

Estados:
- \`0\`: sensor inactivo
- \`1\`: sensor activo
- \`2\`: sensor en error

Objetivos:
- Completa \`verificar_sensores(matriz)\` usando dos bucles \`for\` anidados.
- Para cada módulo, imprime \`Módulo N - Activos: A, Inactivos: I, Errores: E\`.
- Después, una línea en blanco (\`print()\`) y \`Total de sensores en error en la nave: T\`.`,
    codigoBase: `print("Verificación de sensores en módulos espaciales")
print()

sensores = [
    [1, 0, 2, 1],
    [1, 1, 1, 0],
    [0, 2, 2, 1],
    [1, 0, 0, 1]
]

def verificar_sensores(matriz):
    total_error = 0
    # TODO: recorre la matriz, cuenta los estados de cada módulo y muéstralos
    # TODO: al final, muestra el total de sensores en error
    pass

verificar_sensores(sensores)
`,
    resultadoEsperado: `Verificación de sensores en módulos espaciales

Módulo 1 - Activos: 2, Inactivos: 1, Errores: 1
Módulo 2 - Activos: 3, Inactivos: 1, Errores: 0
Módulo 3 - Activos: 1, Inactivos: 1, Errores: 2
Módulo 4 - Activos: 2, Inactivos: 2, Errores: 0

Total de sensores en error en la nave: 3`,
    solucion: `print("Verificación de sensores en módulos espaciales")
print()

sensores = [
    [1, 0, 2, 1],
    [1, 1, 1, 0],
    [0, 2, 2, 1],
    [1, 0, 0, 1]
]

def verificar_sensores(matriz):
    total_error = 0
    for numero, fila in enumerate(matriz, start=1):
        activos = inactivos = errores = 0
        for estado in fila:
            if estado == 1:
                activos += 1
            elif estado == 0:
                inactivos += 1
            else:
                errores += 1
        total_error += errores
        print(f"Módulo {numero} - Activos: {activos}, Inactivos: {inactivos}, Errores: {errores}")
    print()
    print(f"Total de sensores en error en la nave: {total_error}")

verificar_sensores(sensores)
`,
    tests: [
      salidaCompleta(`Verificación de sensores en módulos espaciales

Módulo 1 - Activos: 2, Inactivos: 1, Errores: 1
Módulo 2 - Activos: 3, Inactivos: 1, Errores: 0
Módulo 3 - Activos: 1, Inactivos: 1, Errores: 2
Módulo 4 - Activos: 2, Inactivos: 2, Errores: 0

Total de sensores en error en la nave: 3`),
      {
        descripcion: 'Otra matriz',
        codigo: 'verificar_sensores([[2, 2], [0, 1]])',
        salida: `Módulo 1 - Activos: 0, Inactivos: 0, Errores: 2
Módulo 2 - Activos: 1, Inactivos: 1, Errores: 0

Total de sensores en error en la nave: 2`,
        oculto: true,
      },
    ],
  },
  {
    id: 9,
    tituloAntes: 'Códigos cifrados de la nave con Fibonacci modificado',
    titulo: 'Códigos cifrados con Astro-Fibonacci',
    categoria: 'Bucles',
    descripcion: `Los códigos de acceso a los módulos secretos siguen una variante de la secuencia de Fibonacci.

Reglas:
- Los dos primeros códigos son 1 y 1.
- Cada código nuevo es la suma de los dos anteriores **más 1**: 1 + 1 + 1 = 3, 1 + 3 + 1 = 5, 3 + 5 + 1 = 9…

Objetivos:
- Los dos primeros códigos ya se imprimen. Con un bucle, genera e imprime los códigos del 3 al 25 como \`Código N: valor\`.
- Justo después de cada código que sea múltiplo de 5, imprime \`Código especial detectado!\`

La salida empieza así:
- \`Código 1: 1\`
- \`Código 2: 1\`
- \`Código 3: 3\`
- \`Código 4: 5\`
- \`Código especial detectado!\``,
    codigoBase: `print("Decodificador de accesos con la secuencia Astro-Fibonacci")
print()

a = 1
b = 1

print("Código 1:", a)
print("Código 2:", b)

# TODO: con un bucle, genera los códigos del 3 al 25
# TODO: avisa de los códigos especiales (múltiplos de 5)
`,
    resultadoEsperado: `Decodificador de accesos con la secuencia Astro-Fibonacci

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
Código especial detectado!
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
Código 25: 150049`,
    solucion: `print("Decodificador de accesos con la secuencia Astro-Fibonacci")
print()

a = 1
b = 1

print("Código 1:", a)
print("Código 2:", b)

for numero in range(3, 26):
    a, b = b, a + b + 1
    print(f"Código {numero}: {b}")
    if b % 5 == 0:
        print("Código especial detectado!")
`,
    tests: [
      salidaCompleta(`Decodificador de accesos con la secuencia Astro-Fibonacci

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
Código especial detectado!
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
Código 25: 150049`),
      { descripcion: 'El bucle deja en a y b los dos últimos códigos', codigo: 'print(a, b)', salida: '92735 150049', oculto: true },
    ],
  },
  {
    id: 18,
    tituloAntes: 'Gestión avanzada de misiones y recursos',
    titulo: 'Gestión avanzada de misiones y recursos',
    categoria: 'Estructuras de Datos',
    descripcion: `Planificas las misiones de AstroCode. Cada misión es un diccionario con las claves \`"nombre"\`, \`"duracion"\` (días), \`"combustible"\` y \`"tripulacion"\`.

Objetivos:
- \`agregar_mision(lista, mision)\`: añade la misión a la lista.
- \`total_recursos(lista)\`: devuelve una tupla \`(combustible_total, tripulacion_total)\` con la suma de todas las misiones.
- \`misiones_posibles(lista, max_combustible, max_tripulacion)\`: devuelve la lista de misiones que, cada una por separado, no pasan de esos límites (combustible ≤ máximo y tripulación ≤ máximo).
- Añade con \`agregar_mision\` esta misión: nombre \`"Base Lunar"\`, 45 días, 5000 de combustible y 4 tripulantes.
- El resumen del final ya está escrito.`,
    codigoBase: `print("Gestión avanzada de misiones espaciales")
print()

misiones = [
    {"nombre": "Exploración Marte", "duracion": 30, "combustible": 5000, "tripulacion": 6},
    {"nombre": "Estudio Asteroides", "duracion": 20, "combustible": 3000, "tripulacion": 4},
]

def agregar_mision(lista, mision):
    # TODO: añade la misión a la lista
    pass

def total_recursos(lista):
    # TODO: devuelve (combustible_total, tripulacion_total)
    pass

def misiones_posibles(lista, max_combustible, max_tripulacion):
    # TODO: devuelve las misiones que caben en esos límites
    pass

# TODO: añade la misión "Base Lunar" con agregar_mision

combustible_total, tripulacion_total = total_recursos(misiones)
print(f"Total combustible requerido: {combustible_total}")
print(f"Total tripulación requerida: {tripulacion_total}")
print()
print("Misiones que pueden realizarse con 4000 de combustible y 5 tripulantes:")
for mision in misiones_posibles(misiones, 4000, 5):
    print(f"- {mision['nombre']}")
`,
    resultadoEsperado: `Gestión avanzada de misiones espaciales

Total combustible requerido: 13000
Total tripulación requerida: 14

Misiones que pueden realizarse con 4000 de combustible y 5 tripulantes:
- Estudio Asteroides`,
    solucion: `print("Gestión avanzada de misiones espaciales")
print()

misiones = [
    {"nombre": "Exploración Marte", "duracion": 30, "combustible": 5000, "tripulacion": 6},
    {"nombre": "Estudio Asteroides", "duracion": 20, "combustible": 3000, "tripulacion": 4},
]

def agregar_mision(lista, mision):
    lista.append(mision)

def total_recursos(lista):
    combustible = sum(m["combustible"] for m in lista)
    tripulacion = sum(m["tripulacion"] for m in lista)
    return combustible, tripulacion

def misiones_posibles(lista, max_combustible, max_tripulacion):
    return [m for m in lista if m["combustible"] <= max_combustible and m["tripulacion"] <= max_tripulacion]

agregar_mision(misiones, {"nombre": "Base Lunar", "duracion": 45, "combustible": 5000, "tripulacion": 4})

combustible_total, tripulacion_total = total_recursos(misiones)
print(f"Total combustible requerido: {combustible_total}")
print(f"Total tripulación requerida: {tripulacion_total}")
print()
print("Misiones que pueden realizarse con 4000 de combustible y 5 tripulantes:")
for mision in misiones_posibles(misiones, 4000, 5):
    print(f"- {mision['nombre']}")
`,
    tests: [
      salidaCompleta(`Gestión avanzada de misiones espaciales

Total combustible requerido: 13000
Total tripulación requerida: 14

Misiones que pueden realizarse con 4000 de combustible y 5 tripulantes:
- Estudio Asteroides`),
      { descripcion: 'Total de una lista vacía', codigo: 'print(total_recursos([]))', salida: '(0, 0)', oculto: true },
      {
        descripcion: 'Misiones posibles con otros límites',
        codigo: 'l = [{"nombre": "A", "duracion": 1, "combustible": 10, "tripulacion": 2}, {"nombre": "B", "duracion": 1, "combustible": 50, "tripulacion": 1}]\nprint([m["nombre"] for m in misiones_posibles(l, 50, 1)])',
        salida: "['B']",
        oculto: true,
      },
    ],
  },
  {
    id: 21,
    tituloAntes: 'Detección de Señales Anómalas en AstroCode',
    titulo: 'Detección de señales anómalas',
    categoria: 'Arrays y Listas',
    descripcion: `El centro de control ha recibido lecturas de varias sondas, pero algunas son interferencias. Una señal es válida si es positiva y múltiplo de 3 o de 5.

Objetivos:
- Completa \`senales_validas(lecturas)\`: devuelve las señales válidas ordenadas de mayor a menor.
- Recorre esa lista e imprime cada señal como \`Señal N: valor unidades\` (N empieza en 1).
- Después, una línea en blanco y \`Media de señales válidas: M\`, con la media aritmética redondeada a 2 decimales (\`{media:.2f}\`).`,
    codigoBase: `print("Clasificación de señales interplanetarias")
print()

lecturas = [12, -3, 7, 15, 5, -20, 30, 4, 9, 22, 45, -1, 8, 6]

def senales_validas(lecturas):
    # TODO: filtra las positivas que son múltiplo de 3 o de 5
    # TODO: devuélvelas ordenadas de mayor a menor
    pass

validas = senales_validas(lecturas)

# TODO: muestra cada señal con su posición
# TODO: deja una línea en blanco y muestra la media con 2 decimales
`,
    resultadoEsperado: `Clasificación de señales interplanetarias

Señal 1: 45 unidades
Señal 2: 30 unidades
Señal 3: 15 unidades
Señal 4: 12 unidades
Señal 5: 9 unidades
Señal 6: 6 unidades
Señal 7: 5 unidades

Media de señales válidas: 17.43`,
    solucion: `print("Clasificación de señales interplanetarias")
print()

lecturas = [12, -3, 7, 15, 5, -20, 30, 4, 9, 22, 45, -1, 8, 6]

def senales_validas(lecturas):
    validas = [x for x in lecturas if x > 0 and (x % 3 == 0 or x % 5 == 0)]
    return sorted(validas, reverse=True)

validas = senales_validas(lecturas)

for posicion, senal in enumerate(validas, start=1):
    print(f"Señal {posicion}: {senal} unidades")

print()
media = sum(validas) / len(validas)
print(f"Media de señales válidas: {media:.2f}")
`,
    tests: [
      salidaCompleta(`Clasificación de señales interplanetarias

Señal 1: 45 unidades
Señal 2: 30 unidades
Señal 3: 15 unidades
Señal 4: 12 unidades
Señal 5: 9 unidades
Señal 6: 6 unidades
Señal 7: 5 unidades

Media de señales válidas: 17.43`),
      { descripcion: 'Filtra negativos y no múltiplos', codigo: 'print(senales_validas([-5, 10, 3, 7, 0]))', salida: '[10, 3]', oculto: true },
      { descripcion: 'Ninguna válida', codigo: 'print(senales_validas([1, 2, -3]))', salida: '[]', oculto: true },
    ],
  },
];

// La solución guardada de «Invertir un Árbol Binario» no traía la clase Nodo (el alumno la tiene en
// el código base, pero AstroTutor y los sabotajes usan la solución sola y fallaba con NameError)
export const solucionArbolBinario = `class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

def invertir_arbol(raiz):
    if raiz is None:
        return None
    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)
    return raiz
`;
