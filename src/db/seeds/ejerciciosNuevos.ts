/*
 * Ejercicios nuevos de la fase 13: los 6 huecos de docs/TEMARIO.md.
 * Como los de la fase 7, llevan solución de referencia y tests, uno visible con la salida completa
 * y otros ocultos. test/unit/ejercicios-nuevos.test.mjs comprueba, corrigiendo igual que la API, que
 * la solución los pasa todos y que el código base no.
 * También llevan su «qué practicas» y «por qué» (los del resto de ejercicios están en seeds/porques.ts).
 */
import type { TestSemilla } from './ejercicios';

export interface EjercicioNuevo {
  titulo: string;
  planeta: string;
  // Número de paso en el temario
  orden: number;
  categoria: string;
  nivel: string;
  puntos: number;
  descripcion: string;
  codigoBase: string;
  resultadoEsperado: string;
  solucion: string;
  tests: TestSemilla[];
  practica: string;
  porque: string;
}

const salidaCompleta = (salida: string): TestSemilla => ({ descripcion: 'Salida completa del programa', codigo: '', salida });

export const ejerciciosNuevos: EjercicioNuevo[] = [
  // ───────────── ☿ Mercurio · 10 · final ─────────────
  {
    titulo: 'Informe de despegue',
    planeta: 'mercurio', orden: 10, categoria: 'Variables y Tipos', nivel: 'Fácil', puntos: 150,
    descripcion: `Antes de despegar, el ordenador de la nave genera un informe con los datos de los sensores. Algunos llegan como texto y hay que convertirlos antes de hacer cuentas.

Datos (ya están en el código):
- \`nave = "Kepler-7"\`
- \`tripulacion = "6"\` (llega como texto)
- \`combustible_inicial = 1200\` litros
- \`consumo_por_minuto = 35.5\` litros
- \`minutos_de_vuelo = 24\`
- \`raciones_totales = 100\`

Objetivos:
- Convierte \`tripulacion\` en un número entero.
- Calcula \`combustible_gastado\` (consumo por minuto × minutos) y \`combustible_restante\`.
- Calcula \`porcentaje_restante\`: el restante entre el inicial × 100, redondeado a 1 decimal con \`round(valor, 1)\`.
- Reparte las raciones: \`raciones\` es lo que toca a cada tripulante (división entera) y \`sobran\`, el resto.
- Los \`print\` del final ya están escritos.`,
    codigoBase: `nave = "Kepler-7"
tripulacion = "6"
combustible_inicial = 1200
consumo_por_minuto = 35.5
minutos_de_vuelo = 24
raciones_totales = 100

# TODO: convierte tripulacion en un número entero

# TODO: calcula estas variables
combustible_gastado = 0
combustible_restante = 0
porcentaje_restante = 0
raciones = 0
sobran = 0

print(f"=== INFORME DE DESPEGUE: {nave} ===")
print(f"Tripulantes: {tripulacion}")
print(f"Combustible gastado: {combustible_gastado} L")
print(f"Combustible restante: {combustible_restante} L ({porcentaje_restante}%)")
print(f"Raciones por tripulante: {raciones} (sobran {sobran})")
`,
    resultadoEsperado: `=== INFORME DE DESPEGUE: Kepler-7 ===
Tripulantes: 6
Combustible gastado: 852.0 L
Combustible restante: 348.0 L (29.0%)
Raciones por tripulante: 16 (sobran 4)`,
    solucion: `nave = "Kepler-7"
tripulacion = "6"
combustible_inicial = 1200
consumo_por_minuto = 35.5
minutos_de_vuelo = 24
raciones_totales = 100

tripulacion = int(tripulacion)

combustible_gastado = consumo_por_minuto * minutos_de_vuelo
combustible_restante = combustible_inicial - combustible_gastado
porcentaje_restante = round(combustible_restante / combustible_inicial * 100, 1)
raciones = raciones_totales // tripulacion
sobran = raciones_totales % tripulacion

print(f"=== INFORME DE DESPEGUE: {nave} ===")
print(f"Tripulantes: {tripulacion}")
print(f"Combustible gastado: {combustible_gastado} L")
print(f"Combustible restante: {combustible_restante} L ({porcentaje_restante}%)")
print(f"Raciones por tripulante: {raciones} (sobran {sobran})")
`,
    tests: [
      salidaCompleta(`=== INFORME DE DESPEGUE: Kepler-7 ===
Tripulantes: 6
Combustible gastado: 852.0 L
Combustible restante: 348.0 L (29.0%)
Raciones por tripulante: 16 (sobran 4)`),
      { descripcion: 'La tripulación es un número entero', codigo: 'print(type(tripulacion).__name__)', salida: 'int', oculto: true },
      { descripcion: 'Las raciones repartidas y las que sobran suman el total', codigo: 'print(raciones * tripulacion + sobran)', salida: '100', oculto: true },
      { descripcion: 'El gastado y el restante suman el inicial', codigo: 'print(combustible_gastado + combustible_restante == combustible_inicial)', salida: 'True', oculto: true },
    ],
    practica: 'Variables, conversión de tipos, operaciones (`//` y `%`) y f-strings, todo junto.',
    porque: 'Es lo que hace cualquier programa al empezar: recibir datos, ponerlos en el tipo correcto, calcular y enseñar el resultado de forma clara. Con esto ya sabes escribir un programa completo de principio a fin.',
  },

  // ───────────── ♀ Venus · 5 ─────────────
  {
    titulo: 'Semáforo de la plataforma',
    planeta: 'venus', orden: 5, categoria: 'Estructuras Condicionales', nivel: 'Fácil', puntos: 100,
    descripcion: `La torre de control decide si una nave puede despegar según el viento, en km/h:
- Más de 60: \`"ROJO: despegue cancelado"\`
- Más de 30 (y hasta 60): \`"AMARILLO: despegue con precaución"\`
- 30 o menos: \`"VERDE: despegue autorizado"\`

Objetivos:
- Guarda en la variable \`estado\` el mensaje que toca según \`viento\`, usando \`if\`, \`elif\` y \`else\`.
- Los \`print\` del final ya están escritos.`,
    codigoBase: `print("Torre de control: semáforo de despegue")
viento = 48

# TODO: guarda en estado el mensaje que toca (if / elif / else)
estado = ""

print(f"Viento: {viento} km/h")
print(estado)
`,
    resultadoEsperado: `Torre de control: semáforo de despegue
Viento: 48 km/h
AMARILLO: despegue con precaución`,
    solucion: `print("Torre de control: semáforo de despegue")
viento = 48

if viento > 60:
    estado = "ROJO: despegue cancelado"
elif viento > 30:
    estado = "AMARILLO: despegue con precaución"
else:
    estado = "VERDE: despegue autorizado"

print(f"Viento: {viento} km/h")
print(estado)
`,
    tests: [
      salidaCompleta(`Torre de control: semáforo de despegue
Viento: 48 km/h
AMARILLO: despegue con precaución`),
      { descripcion: 'El estado se guarda en la variable estado', codigo: 'print(estado.split(":")[0])', salida: 'AMARILLO', oculto: true },
    ],
    practica: '`elif` para elegir entre más de dos caminos.',
    porque: 'Casi ningún problema real es de sí o no. La torre distingue tres niveles de peligro, y así lo hace cualquier programa que clasifica datos: notas, alertas, tarifas…',
  },

  // ───────────── 🜨 Tierra · 9 ─────────────
  {
    titulo: 'Repostaje hasta llenar',
    planeta: 'tierra', orden: 9, categoria: 'Bucles', nivel: 'Fácil', puntos: 100,
    descripcion: `En la estación orbital se reposta de 40 en 40 litros. No sabes cuántas cargas harán falta: depende de cuánto quede en el depósito.

Datos (ya están en el código):
- \`deposito = 35\` litros
- \`capacidad = 200\` litros
- \`carga = 40\` litros por carga

Objetivos:
- Con un bucle \`while\`: mientras quepa una carga entera (\`deposito + carga <= capacidad\`), añade la carga al depósito y suma 1 a \`cargas\`.
- No llenes de más: si la siguiente carga no cabe entera, para.
- Los \`print\` del final ya están escritos.`,
    codigoBase: `print("Repostaje en la estación orbital")
deposito = 35
capacidad = 200
carga = 40
cargas = 0

# TODO: mientras quepa una carga entera, añádela y cuenta una carga más

print(f"Cargas: {cargas}")
print(f"Depósito: {deposito} litros")
`,
    resultadoEsperado: `Repostaje en la estación orbital
Cargas: 4
Depósito: 195 litros`,
    solucion: `print("Repostaje en la estación orbital")
deposito = 35
capacidad = 200
carga = 40
cargas = 0

while deposito + carga <= capacidad:
    deposito += carga
    cargas += 1

print(f"Cargas: {cargas}")
print(f"Depósito: {deposito} litros")
`,
    tests: [
      salidaCompleta(`Repostaje en la estación orbital
Cargas: 4
Depósito: 195 litros`),
      { descripcion: 'No se pasa de la capacidad', codigo: 'print(deposito <= capacidad)', salida: 'True', oculto: true },
      { descripcion: 'Ya no cabe otra carga entera', codigo: 'print(deposito + carga > capacidad)', salida: 'True', oculto: true },
    ],
    practica: '`while`: repetir mientras se cumpla una condición, sin saber cuántas vueltas harán falta.',
    porque: 'A veces no sabes cuántas veces hay que repetir algo: reintentar una conexión, repostar o leer hasta que se acaben los datos. Para eso está `while`.',
  },

  // ───────────── ♂ Marte · 6 ─────────────
  {
    titulo: 'Inventario de la bodega',
    planeta: 'marte', orden: 6, categoria: 'Estructuras de Datos', nivel: 'Intermedio', puntos: 200,
    descripcion: `La bodega de la nave lleva su inventario en un diccionario: cada material con sus unidades, por ejemplo \`{"agua": 30, "comida": 18}\`.

Objetivos:
- \`total_unidades(bodega)\`: devuelve la suma de las unidades de todos los materiales (0 si la bodega está vacía).
- \`mas_abundante(bodega)\`: devuelve el nombre del material del que hay más unidades. Si empatan, el primero que aparezca.
- \`reponer(bodega, material, cantidad)\`: suma \`cantidad\` a ese material. Si no estaba en la bodega, lo añade con esa cantidad. No devuelve nada.
- Las pruebas del final ya están escritas.`,
    codigoBase: `print("Inventario de la bodega")

def total_unidades(bodega):
    # TODO
    return 0

def mas_abundante(bodega):
    # TODO
    return ""

def reponer(bodega, material, cantidad):
    # TODO
    pass

bodega = {"oxígeno": 12, "agua": 30, "comida": 18}
reponer(bodega, "agua", 5)
reponer(bodega, "medicinas", 4)
print(bodega)
print(total_unidades(bodega))
print(mas_abundante(bodega))
`,
    resultadoEsperado: `Inventario de la bodega
{'oxígeno': 12, 'agua': 35, 'comida': 18, 'medicinas': 4}
69
agua`,
    solucion: `print("Inventario de la bodega")

def total_unidades(bodega):
    total = 0
    for unidades in bodega.values():
        total += unidades
    return total

def mas_abundante(bodega):
    mejor = ""
    for material, unidades in bodega.items():
        if mejor == "" or unidades > bodega[mejor]:
            mejor = material
    return mejor

def reponer(bodega, material, cantidad):
    bodega[material] = bodega.get(material, 0) + cantidad

bodega = {"oxígeno": 12, "agua": 30, "comida": 18}
reponer(bodega, "agua", 5)
reponer(bodega, "medicinas", 4)
print(bodega)
print(total_unidades(bodega))
print(mas_abundante(bodega))
`,
    tests: [
      salidaCompleta(`Inventario de la bodega
{'oxígeno': 12, 'agua': 35, 'comida': 18, 'medicinas': 4}
69
agua`),
      { descripcion: 'Total de otra bodega', codigo: 'print(total_unidades({"a": 1, "b": 2, "c": 3}))', salida: '6', oculto: true },
      { descripcion: 'Bodega vacía', codigo: 'print(total_unidades({}))', salida: '0', oculto: true },
      { descripcion: 'Empate: gana el primero', codigo: 'print(mas_abundante({"x": 5, "y": 9, "z": 9}))', salida: 'y', oculto: true },
      { descripcion: 'Reponer dos veces un material nuevo', codigo: 'b = {}\nreponer(b, "agua", 3)\nreponer(b, "agua", 2)\nprint(b)', salida: "{'agua': 5}", oculto: true },
    ],
    practica: 'Crear, leer, modificar y recorrer un diccionario dentro de funciones.',
    porque: 'Casi todos los datos tienen nombre: el stock de una tienda, la ficha de un usuario, la configuración de un programa… El diccionario es la estructura que más vas a usar después de la lista.',
  },

  // ───────────── ♄ Saturno · 2 ─────────────
  {
    titulo: 'Cuenta atrás recursiva',
    planeta: 'saturno', orden: 2, categoria: 'Recursión', nivel: 'Difícil', puntos: 300,
    descripcion: `Tres funciones para practicar la recursión. Todas deben resolverse **sin bucles** (ni \`for\` ni \`while\`): cada una se llama a sí misma con un problema más pequeño.

Objetivos:
- \`cuenta_atras(n)\`: imprime n, n - 1, … hasta 1, una por línea, y después \`¡Despegue!\`.
- \`suma_hasta(n)\`: devuelve 1 + 2 + … + n. \`suma_hasta(0)\` es 0.
- \`potencia(base, exponente)\`: devuelve base elevada a exponente multiplicando. Con exponente 0 devuelve 1.
- Las pruebas del final ya están escritas.`,
    codigoBase: `def cuenta_atras(n):
    # TODO: caso base (n == 0) y llamada recursiva
    pass

def suma_hasta(n):
    # TODO
    return 0

def potencia(base, exponente):
    # TODO
    return 1

cuenta_atras(3)
print(suma_hasta(10))
print(potencia(2, 8))
`,
    resultadoEsperado: `3
2
1
¡Despegue!
55
256`,
    solucion: `def cuenta_atras(n):
    if n == 0:
        print("¡Despegue!")
        return
    print(n)
    cuenta_atras(n - 1)

def suma_hasta(n):
    if n == 0:
        return 0
    return n + suma_hasta(n - 1)

def potencia(base, exponente):
    if exponente == 0:
        return 1
    return base * potencia(base, exponente - 1)

cuenta_atras(3)
print(suma_hasta(10))
print(potencia(2, 8))
`,
    tests: [
      salidaCompleta(`3
2
1
¡Despegue!
55
256`),
      { descripcion: 'suma_hasta(0)', codigo: 'print(suma_hasta(0))', salida: '0', oculto: true },
      { descripcion: 'suma_hasta(100)', codigo: 'print(suma_hasta(100))', salida: '5050', oculto: true },
      { descripcion: 'potencia con exponente 0', codigo: 'print(potencia(5, 0))', salida: '1', oculto: true },
      { descripcion: 'potencia(3, 4)', codigo: 'print(potencia(3, 4))', salida: '81', oculto: true },
      {
        descripcion: 'Sin bucles',
        codigo: 'import inspect\nfuente = "".join(inspect.getsource(f) for f in (cuenta_atras, suma_hasta, potencia))\nprint("for " in fuente or "while " in fuente)',
        salida: 'False',
        oculto: true,
      },
    ],
    practica: 'Recursión: un caso base y una llamada a sí misma con un problema más pequeño.',
    porque: 'Los árboles, las carpetas dentro de carpetas o las rutas en un mapa tienen problemas dentro de problemas. La recursión los resuelve de forma natural, y es la base de muchos algoritmos de los retos de Saturno.',
  },

  // ───────────── ♄ Saturno · 4 ─────────────
  {
    titulo: 'Tu propia nave',
    planeta: 'saturno', orden: 4, categoria: 'Objetos y Clases', nivel: 'Difícil', puntos: 300,
    descripcion: `Diseña tu nave como una clase: cada nave guarda sus datos y sabe viajar, repostar y dar un informe.

Objetivos (completa la clase \`Nave\`):
- \`__init__(self, nombre, combustible)\`: guarda el nombre y el combustible, y empieza con \`self.distancia = 0\`.
- \`viajar(self, km)\`: cada km gasta 2 litros. Si hay combustible suficiente, lo gasta, suma los km a \`distancia\` y devuelve \`True\`. Si no lo hay, no cambia nada y devuelve \`False\`.
- \`repostar(self, litros)\`: suma los litros al combustible.
- \`informe(self)\`: devuelve el texto \`"<nombre>: <combustible> L, <distancia> km recorridos"\`.
- Las pruebas del final ya están escritas.`,
    codigoBase: `class Nave:
    def __init__(self, nombre, combustible):
        # TODO: guarda los datos y empieza con distancia 0
        pass

    def viajar(self, km):
        # TODO
        pass

    def repostar(self, litros):
        # TODO
        pass

    def informe(self):
        # TODO
        return ""

kepler = Nave("Kepler", 100)
print(kepler.viajar(30))
print(kepler.viajar(30))
kepler.repostar(50)
print(kepler.viajar(30))
print(kepler.informe())
`,
    resultadoEsperado: `True
False
True
Kepler: 30 L, 60 km recorridos`,
    solucion: `class Nave:
    def __init__(self, nombre, combustible):
        self.nombre = nombre
        self.combustible = combustible
        self.distancia = 0

    def viajar(self, km):
        gasto = km * 2
        if gasto > self.combustible:
            return False
        self.combustible -= gasto
        self.distancia += km
        return True

    def repostar(self, litros):
        self.combustible += litros

    def informe(self):
        return f"{self.nombre}: {self.combustible} L, {self.distancia} km recorridos"

kepler = Nave("Kepler", 100)
print(kepler.viajar(30))
print(kepler.viajar(30))
kepler.repostar(50)
print(kepler.viajar(30))
print(kepler.informe())
`,
    tests: [
      salidaCompleta(`True
False
True
Kepler: 30 L, 60 km recorridos`),
      { descripcion: 'Dos naves no comparten datos', codigo: 'a = Nave("A", 10)\nb = Nave("B", 10)\na.viajar(5)\nprint(a.informe(), "|", b.informe())', salida: 'A: 0 L, 5 km recorridos | B: 10 L, 0 km recorridos', oculto: true },
      { descripcion: 'Sin combustible no viaja ni cambia nada', codigo: 'n = Nave("C", 0)\nprint(n.viajar(1), n.informe())', salida: 'False C: 0 L, 0 km recorridos', oculto: true },
      { descripcion: 'Con el combustible justo, sí viaja', codigo: 'n = Nave("D", 20)\nprint(n.viajar(10), n.combustible)', salida: 'True 0', oculto: true },
    ],
    practica: 'Clases: `__init__`, atributos con `self` y métodos.',
    porque: 'Las clases juntan los datos y lo que se puede hacer con ellos. Así se organizan los programas grandes: cada pieza (una nave, un usuario, una partida) sabe cuidar de sus propios datos.',
  },
];
