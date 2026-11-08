/*
 * Lecciones de la ruta (fase 12, docs/TEMARIO.md): las 16 de Mercurio, Venus y la Tierra.
 *
 * Cada lección:
 * - tiene bloques de texto, un ejemplo ejecutable («Pruébalo») y el error típico;
 * - termina con una pregunta «¿qué imprime?».
 *
 * Las opciones de la pregunta son salidas literales: test/unit/lecciones.test.mjs ejecuta cada
 * código y comprueba que la opción correcta es exactamente lo que imprime.
 *
 * El texto usa el formato de los enunciados: párrafos, listas con «- », **negrita** y `código`.
 */

export type BloqueLeccion =
  | { tipo: 'texto'; texto: string }
  // pista: qué cambiar en el ejemplo para experimentar
  | { tipo: 'codigo'; codigo: string; pista?: string }
  // El error típico: explicación y el código que lo provoca (no se ejecuta en las pruebas)
  | { tipo: 'error'; texto: string; codigo: string };

export interface PreguntaLeccion {
  codigo: string;
  // Cada opción es una salida; la explicación se enseña al elegirla
  opciones: { texto: string; explicacion: string }[];
  correcta: number;
}

export interface LeccionSemilla {
  clave: string;
  planeta: string;
  // Número de paso en el temario
  orden: number;
  titulo: string;
  bloques: BloqueLeccion[];
  pregunta: PreguntaLeccion;
}

const c = (...lineas: string[]) => lineas.join('\n');

export const lecciones: LeccionSemilla[] = [
  // ───────────────────────── ☿ Mercurio · Primer contacto ─────────────────────────
  {
    clave: 'print', planeta: 'mercurio', orden: 1,
    titulo: 'Tu primer programa: print y comentarios',
    bloques: [
      { tipo: 'texto', texto: c(
        'Un programa es una lista de órdenes que el ordenador ejecuta **de arriba abajo**, una detrás de otra.',
        '',
        'La primera orden que vas a usar es `print`: muestra un mensaje en la pantalla. Es el altavoz de la nave.',
      ) },
      { tipo: 'codigo', codigo: c(
        '# Esto es un comentario: Python lo ignora',
        'print("Iniciando sistemas...")',
        'print("Motores listos")',
        'print(3 + 4)',
      ), pista: 'Añade una línea con `print("¡Despegue!")` y vuelve a ejecutar.' },
      { tipo: 'texto', texto: c(
        '- El texto va entre **comillas**. Sin comillas, Python cree que es el nombre de algo.',
        '- `print(3 + 4)` no imprime «3 + 4», sino el resultado: `7`. Los números no llevan comillas.',
        '- Lo que empieza por `#` es un **comentario**: una nota para quien lee el código. Python no lo ejecuta.',
      ) },
      { tipo: 'error', texto: 'Cada comilla y cada paréntesis que abres hay que cerrarlo. Si se te olvida una comilla, Python avisa con un `SyntaxError` y no ejecuta nada.',
        codigo: 'print("Motores listos)' },
    ],
    pregunta: {
      codigo: c('print("Hola")', '# print("Adiós")', 'print("Fin")'),
      opciones: [
        { texto: 'Hola\nFin', explicacion: 'Exacto. La segunda línea empieza por `#`: es un comentario y Python se la salta.' },
        { texto: 'Hola\nAdiós\nFin', explicacion: 'La segunda línea empieza por `#`, así que es un comentario: Python no la ejecuta.' },
        { texto: 'Hola', explicacion: 'Python sigue hasta el final del programa: después del comentario también imprime «Fin».' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'variables', planeta: 'mercurio', orden: 2,
    titulo: 'Variables: cajas con nombre',
    bloques: [
      { tipo: 'texto', texto: 'Una nave necesita recordar datos: cuánto combustible queda, cómo se llama quien la pilota… Para eso están las **variables**: una caja con un nombre en la que guardas un valor.' },
      { tipo: 'codigo', codigo: c(
        'combustible = 750',
        'piloto = "Ada"',
        'print(piloto)',
        'print(combustible)',
        'combustible = combustible - 200',
        'print(combustible)',
      ), pista: 'Cambia el nombre del piloto por el tuyo.' },
      { tipo: 'texto', texto: c(
        '- `=` significa **guardar**: «mete 750 en la caja `combustible`». No es el igual de las matemáticas.',
        '- Puedes cambiar el valor cuando quieras. `combustible = combustible - 200` coge lo que había (750), le resta 200 y lo vuelve a guardar.',
        '- Los nombres van sin espacios ni tildes. Si son varias palabras, se unen con guion bajo: `nivel_oxigeno`.',
      ) },
      { tipo: 'error', texto: 'Usar una variable con otro nombre del que tiene. Python distingue cada letra, y también mayúsculas de minúsculas: si escribes mal el nombre, da `NameError: name ... is not defined`.',
        codigo: 'combustible = 750\nprint(combustibe)' },
    ],
    pregunta: {
      codigo: c('x = 5', 'x = x + 3', 'print(x)'),
      opciones: [
        { texto: '8', explicacion: 'Eso es. La segunda línea coge el 5, le suma 3 y guarda el 8 en la misma caja.' },
        { texto: '5', explicacion: 'La segunda línea cambia el valor: coge el 5, le suma 3 y guarda 8 en `x`.' },
        { texto: 'x + 3', explicacion: 'Sin comillas, `x + 3` es una operación, no un texto. Y `print(x)` enseña el valor de la caja, no su nombre.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'tipos', planeta: 'mercurio', orden: 4,
    titulo: 'Tipos de datos: números, texto y verdadero/falso',
    bloques: [
      { tipo: 'texto', texto: c(
        'No todos los datos son iguales. Python distingue el **tipo** de cada valor, y el tipo decide qué puedes hacer con él.',
        '- `int`: números enteros, como `25` o `-3`.',
        '- `float`: números con decimales, escritos con **punto**: `98.6`.',
        '- `str`: texto, siempre entre comillas: `"Venus"`.',
        '- `bool`: verdadero o falso, `True` o `False`.',
      ) },
      { tipo: 'codigo', codigo: c(
        'tripulacion = 5',
        'temperatura = 21.5',
        'nave = "Estrella Polar"',
        'en_orbita = True',
        'print(type(tripulacion), type(temperatura), type(en_orbita))',
        'print(f"La nave {nave} lleva {tripulacion} tripulantes")',
      ), pista: 'Cambia `tripulacion` a 7 y mira cómo cambia la frase.' },
      { tipo: 'texto', texto: 'La última línea es una **f-string**: una `f` antes de las comillas y, dentro, variables entre llaves. Python sustituye cada `{variable}` por su valor. Es la forma más cómoda de mezclar texto y datos.' },
      { tipo: 'error', texto: 'Olvidar la `f`. Sin ella, Python no sustituye nada e imprime las llaves tal cual: «Lleva {tripulacion} tripulantes».',
        codigo: 'tripulacion = 5\nprint("Lleva {tripulacion} tripulantes")' },
    ],
    pregunta: {
      codigo: c('edad = 25', 'print(f"Edad: {edad + 1}")'),
      opciones: [
        { texto: 'Edad: 26', explicacion: 'Correcto. Entre las llaves puede ir una operación, y Python pone su resultado.' },
        { texto: 'Edad: {edad + 1}', explicacion: 'Con la `f` delante, Python calcula lo que hay entre llaves y pone el resultado.' },
        { texto: 'Edad: 25', explicacion: 'Dentro de las llaves hay una operación: `edad + 1` vale 26.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'operadores', planeta: 'mercurio', orden: 6,
    titulo: 'Operadores: + - * /, // y %',
    bloques: [
      { tipo: 'texto', texto: c(
        'Python es una calculadora muy potente. `+` suma, `-` resta, `*` multiplica y `/` divide. Y hay dos más que usarás mucho:',
        '- `//` es la **división entera**: cuántas veces cabe, sin decimales. `17 // 5` es `3`.',
        '- `%` es el **resto** de la división: `17 % 5` es `2`. Sirve, por ejemplo, para saber si un número es par: `n % 2` vale 0 si lo es.',
      ) },
      { tipo: 'codigo', codigo: c(
        'combustible = 1000',
        'consumo = 150',
        'print(combustible - consumo * 3)',
        'print(combustible / 3)',
        'print(combustible // 3)',
        'print(combustible % 3)',
      ), pista: '¿Cuántas maniobras completas de 150 litros puedes hacer con 1000? Prueba `print(combustible // consumo)`.' },
      { tipo: 'texto', texto: c(
        'Como en matemáticas, `*` y `/` van antes que `+` y `-`: `1000 - 150 * 3` multiplica primero. Para otro orden, usa paréntesis: `(1000 - 150) * 3`.',
        '',
        'Y `/` siempre da un número con decimales (`float`), aunque la división sea exacta: `10 / 2` es `5.0`.',
      ) },
      { tipo: 'error', texto: 'Sumar texto y número. Python no mezcla tipos sin que se lo pidas y da `TypeError`. Usa una f-string: `f"Combustible: {750}"`.',
        codigo: 'print("Combustible: " + 750)' },
    ],
    pregunta: {
      codigo: 'print(20 // 6, 20 % 6)',
      opciones: [
        { texto: '3 2', explicacion: 'Eso es: el 6 cabe 3 veces en el 20 y sobran 2.' },
        { texto: '3.3333333333333335 2', explicacion: '`//` es la división entera: se queda solo con cuántas veces cabe, 3.' },
        { texto: '2 3', explicacion: 'Al revés: `20 // 6` es cuántas veces cabe el 6 (3) y `20 % 6`, lo que sobra (2).' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'conversion', planeta: 'mercurio', orden: 8,
    titulo: 'Convertir tipos: int(), float() y str()',
    bloques: [
      { tipo: 'texto', texto: c(
        'Muchas veces un dato llega con el tipo equivocado. Un sensor envía la velocidad como texto, `"2500"`, y así no se puede operar con ella. Para cambiar el tipo hay funciones que se llaman como el tipo:',
        '- `int("2500")` → `2500`, un entero.',
        '- `float("3.5")` → `3.5`.',
        '- `str(42)` → `"42"`, un texto.',
        '- `int(98.6)` → `98`: corta los decimales, no redondea. Para redondear está `round`.',
      ) },
      { tipo: 'codigo', codigo: c(
        'velocidad = "2500"',
        'print(velocidad * 2)',
        'velocidad = int(velocidad)',
        'print(velocidad * 2)',
        'print(int(98.6), round(98.6))',
      ), pista: 'Prueba qué da `float("2500")`.' },
      { tipo: 'texto', texto: 'Fíjate en la primera línea que imprime: `"2500" * 2` da «25002500». Con texto, `*` significa **repetir**. Por eso importa saber de qué tipo es cada dato antes de operar con él.' },
      { tipo: 'error', texto: 'Convertir algo que no parece un número. Python solo convierte textos que son números, y si no, da `ValueError`.',
        codigo: 'print(int("dos mil"))' },
    ],
    pregunta: {
      codigo: c('a = "7"', 'b = 3', 'print(int(a) + b)'),
      opciones: [
        { texto: '10', explicacion: 'Correcto. `int(a)` convierte el texto "7" en el número 7, y 7 + 3 = 10.' },
        { texto: '73', explicacion: 'Eso pasaría juntando dos textos. Aquí `int(a)` convierte "7" en el número 7 y se suma.' },
        { texto: '7', explicacion: 'Después de convertir `a` en el número 7, se le suma `b`, que vale 3.' },
      ],
      correcta: 0,
    },
  },

  // ───────────────────────── ♀ Venus · Tomar decisiones ─────────────────────────
  {
    clave: 'comparar', planeta: 'venus', orden: 1,
    titulo: 'Comparar: ==, !=, <, >= y los booleanos',
    bloques: [
      { tipo: 'texto', texto: c(
        'Antes de tomar una decisión, la nave tiene que **comparar**: ¿queda poco combustible? ¿Está cerrada la escotilla? Una comparación siempre da `True` (verdadero) o `False` (falso). Esos dos valores son los **booleanos**.',
        '- `==` igual y `!=` distinto.',
        '- `<` menor y `>` mayor.',
        '- `<=` menor o igual y `>=` mayor o igual.',
      ) },
      { tipo: 'codigo', codigo: c(
        'oxigeno = 85',
        'print(oxigeno > 90)',
        'print(oxigeno >= 85)',
        'print(oxigeno == 85)',
        'print("Venus" != "venus")',
      ), pista: 'Cambia el oxígeno a 95 y adivina qué saldrá antes de ejecutar.' },
      { tipo: 'texto', texto: 'La última comparación da `True`: para Python, una mayúscula y su minúscula son letras distintas. Cuando compares un texto que escribe una persona, conviene pasarlo antes a minúsculas con `.lower()`: `"SÍ".lower()` es `"sí"`.' },
      { tipo: 'error', texto: 'Confundir `=` con `==`. `oxigeno = 90` **guarda** 90; `oxigeno == 90` **pregunta** si vale 90. En una condición, un solo `=` da `SyntaxError`.',
        codigo: 'oxigeno = 85\nif oxigeno = 90:\n    print("Lleno")' },
    ],
    pregunta: {
      codigo: c('nivel = 3', 'print(nivel != 3, nivel <= 5)'),
      opciones: [
        { texto: 'False True', explicacion: 'Eso es. `nivel` vale 3, así que no es distinto de 3 (False), y 3 sí es menor o igual que 5 (True).' },
        { texto: 'True True', explicacion: '`!=` pregunta si es distinto. `nivel` vale justo 3, así que no es distinto: False.' },
        { texto: 'False False', explicacion: '3 es menor o igual que 5, así que la segunda comparación es True.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'if-else', planeta: 'venus', orden: 2,
    titulo: 'if y else: la nave decide',
    bloques: [
      { tipo: 'texto', texto: 'Hasta ahora tus programas hacían siempre lo mismo, línea a línea. Pero el ordenador de una nave no puede ser así: si el combustible baja demasiado, tiene que **avisar**; si no, seguir callado. Para eso está `if`: **ejecuta un bloque solo si se cumple una condición**.' },
      { tipo: 'codigo', codigo: c(
        'combustible = 18',
        '',
        'if combustible < 20:',
        '    print("Reserva de combustible")',
        '    print("Vuelve a la base")',
        'else:',
        '    print("Combustible suficiente")',
        '',
        'print("Fin del chequeo")',
      ), pista: 'Cambia `18` por `50` y vuelve a ejecutar.' },
      { tipo: 'texto', texto: c(
        '- La condición termina en **dos puntos** (`:`).',
        '- Lo que depende del `if` va **sangrado**, con 4 espacios. Así sabe Python qué líneas van dentro.',
        '- `else` es «en cualquier otro caso». Es opcional, y nunca lleva condición.',
        '- `print("Fin del chequeo")` no está sangrado: se ejecuta siempre.',
      ) },
      { tipo: 'error', texto: 'Olvidar los dos puntos o el sangrado. Sin `:` al final del `if`, Python da `SyntaxError`; sin sangrado, `IndentationError`.',
        codigo: 'combustible = 18\nif combustible < 20\n    print("Reserva")' },
    ],
    pregunta: {
      codigo: c('oxigeno = 95', 'if oxigeno > 90:', '    print("Normal")', 'print("Revisado")'),
      opciones: [
        { texto: 'Normal', explicacion: 'Casi. `print("Revisado")` no está sangrado, así que no depende del `if` y se ejecuta siempre.' },
        { texto: 'Normal\nRevisado', explicacion: 'Exacto. 95 es mayor que 90, así que se imprime «Normal», y «Revisado» se imprime siempre.' },
        { texto: 'Revisado', explicacion: '95 es mayor que 90: la condición se cumple y también se imprime «Normal».' },
      ],
      correcta: 1,
    },
  },
  {
    clave: 'elif', planeta: 'venus', orden: 4,
    titulo: 'elif: más de dos caminos',
    bloques: [
      { tipo: 'texto', texto: 'Con `if` y `else` hay dos caminos. Pero el ordenador de la nave no se conforma con «bien o mal»: distingue **normal**, **aviso** y **peligro**. Para eso está `elif` («si no, si…»): añade todas las condiciones que necesites entre el `if` y el `else`.' },
      { tipo: 'codigo', codigo: c(
        'temperatura = 72',
        '',
        'if temperatura > 90:',
        '    print("PELIGRO: motor sobrecalentado")',
        'elif temperatura > 70:',
        '    print("Aviso: temperatura alta")',
        'else:',
        '    print("Temperatura normal")',
      ), pista: 'Prueba con 95, con 72 y con 40.' },
      { tipo: 'texto', texto: 'Python mira las condiciones **de arriba abajo** y se queda con la **primera** que se cumple; las demás ni las mira. Con 95 se cumplen las dos primeras, pero solo se imprime «PELIGRO». Por eso el orden importa: la condición más exigente va primero.' },
      { tipo: 'error', texto: 'Poner las condiciones al revés. Todo lo que pasa de 90 también pasa de 70 y se queda en el primer caso: el `elif` de 90 nunca llega a ejecutarse.',
        codigo: 'temperatura = 95\nif temperatura > 70:\n    print("Aviso")\nelif temperatura > 90:\n    print("PELIGRO")' },
    ],
    pregunta: {
      codigo: c('n = 15', 'if n > 10:', '    print("A")', 'elif n > 5:', '    print("B")', 'else:', '    print("C")'),
      opciones: [
        { texto: 'A', explicacion: 'Correcto. 15 > 10 es la primera condición que se cumple, y Python se salta las demás.' },
        { texto: 'A\nB', explicacion: 'Python se queda solo con la primera condición que se cumple y salta el resto, aunque también se cumplan.' },
        { texto: 'B', explicacion: '15 > 10 se cumple antes, así que ni llega a mirar la segunda condición.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'and-or-not', planeta: 'venus', orden: 6,
    titulo: 'and, or y not: juntar condiciones',
    bloques: [
      { tipo: 'texto', texto: c(
        'A veces una sola comparación no basta. Para salir al exterior hace falta que el traje esté listo **y** que haya oxígeno suficiente. Las condiciones se combinan con tres palabras:',
        '- `and`: verdadero si se cumplen **las dos**.',
        '- `or`: verdadero si se cumple **al menos una**.',
        '- `not`: le da la vuelta: `not True` es `False`.',
      ) },
      { tipo: 'codigo', codigo: c(
        'traje_listo = True',
        'oxigeno = 40',
        '',
        'if traje_listo and oxigeno >= 50:',
        '    print("Puedes salir")',
        'else:',
        '    print("Espera dentro")',
        '',
        'alarma = oxigeno < 20 or not traje_listo',
        'print(alarma)',
      ), pista: 'Sube el oxígeno a 60 y vuelve a ejecutar.' },
      { tipo: 'texto', texto: 'Se lee casi como en castellano: `oxigeno < 20 or not traje_listo` es «hay alarma si el oxígeno baja de 20 o si el traje no está listo». Y como el resultado es un booleano, se puede guardar en una variable, como `alarma`.' },
      { tipo: 'error', texto: 'Dejar una comparación a medias. Cada lado del `and` necesita su comparación completa: `oxigeno > 20 and oxigeno < 80`. Python también admite `20 < oxigeno < 80`.',
        codigo: 'oxigeno = 40\nif oxigeno > 20 and < 80:\n    print("Bien")' },
    ],
    pregunta: {
      codigo: c('a = True', 'b = False', 'print(a and b, a or b, not b)'),
      opciones: [
        { texto: 'False True True', explicacion: 'Eso es: `and` necesita las dos (False), `or` con una basta (True) y `not False` es True.' },
        { texto: 'True True False', explicacion: '`a and b` necesita que las dos sean verdaderas, y `b` no lo es: False. Y `not b` le da la vuelta a False: True.' },
        { texto: 'False False True', explicacion: '`a or b` es verdadero en cuanto una lo es, y `a` lo es: True.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'funciones-rellenar', planeta: 'venus', orden: 7,
    titulo: 'Rellenar una función: parámetros y return',
    bloques: [
      { tipo: 'texto', texto: 'En las misiones y los retos no escribes el programa entero: te damos una **función** ya empezada y tú escribes lo de dentro. Una función es un trozo de código con nombre que **recibe datos** (los parámetros, entre paréntesis) y **devuelve una respuesta** con `return`.' },
      { tipo: 'codigo', codigo: c(
        'def piloto(altura, velocidad):',
        '    if velocidad < -5:',
        '        return "frenar"',
        '    return "planear"',
        '',
        'print(piloto(100, -8))',
        'print(piloto(100, -2))',
      ), pista: 'Añade `print(piloto(10, -6))` al final.' },
      { tipo: 'texto', texto: c(
        '- `def piloto(altura, velocidad):` **define** la función. Lo que va sangrado debajo es su cuerpo.',
        '- Al **llamarla**, `piloto(100, -8)`, los valores entran en los parámetros: `altura` vale 100 y `velocidad`, -8.',
        '- `return` termina la función y entrega la respuesta. Por eso no hace falta `else`: si se cumple el `if`, el segundo `return` ni se alcanza.',
        '',
        'En las misiones, los sensores llegan en un **diccionario**: `sensores["altura"]` lee el valor de la clave `"altura"`. El código base ya te lo deja leído en variables, como `altura = sensores["altura"]`.',
      ) },
      { tipo: 'error', texto: 'Usar `print` en vez de `return`. `print` enseña la respuesta en pantalla, pero la función no la **devuelve**: quien la llama recibe `None`, y la misión no sabe qué has decidido.',
        codigo: 'def doble(n):\n    print(n * 2)\n\nresultado = doble(4)\nprint(resultado)' },
    ],
    pregunta: {
      codigo: c('def doble(n):', '    return n * 2', '', 'print(doble(4) + 1)'),
      opciones: [
        { texto: '9', explicacion: 'Correcto. `doble(4)` devuelve 8, y luego se le suma 1.' },
        { texto: '8', explicacion: '`doble(4)` devuelve 8, pero después se le suma 1: 9.' },
        { texto: 'n * 2 + 1', explicacion: '`return` devuelve el resultado de la operación, no su texto.' },
      ],
      correcta: 0,
    },
  },

  // ───────────────────────── 🜨 Tierra · Repetir ─────────────────────────
  {
    clave: 'listas', planeta: 'tierra', orden: 1,
    titulo: 'Listas: muchos datos en una variable',
    bloques: [
      { tipo: 'texto', texto: 'Una nave no lleva a un astronauta: lleva una tripulación. Para guardar muchos datos juntos y en orden está la **lista**: valores entre corchetes, separados por comas.' },
      { tipo: 'codigo', codigo: c(
        'tripulacion = ["Ada", "Neil", "Valentina"]',
        'print(tripulacion[0])',
        'print(tripulacion[-1])',
        'print(len(tripulacion))',
        'tripulacion[1] = "Yuri"',
        'print(tripulacion)',
      ), pista: 'Imprime `tripulacion[2]` y añade un cuarto nombre a la lista.' },
      { tipo: 'texto', texto: c(
        '- Cada elemento tiene una **posición** (índice), y se empieza a contar en **0**: `tripulacion[0]` es el primero.',
        '- Los índices negativos cuentan desde el final: `[-1]` es el último.',
        '- `len(lista)` dice cuántos elementos tiene.',
        '- Una lista se puede cambiar: `tripulacion[1] = "Yuri"` sustituye el segundo.',
      ) },
      { tipo: 'error', texto: 'Pedir una posición que no existe. Con tres tripulantes, los índices van de 0 a 2: `tripulacion[3]` da `IndexError: list index out of range`.',
        codigo: 'tripulacion = ["Ada", "Neil", "Valentina"]\nprint(tripulacion[3])' },
    ],
    pregunta: {
      codigo: c('planetas = ["Mercurio", "Venus", "Tierra", "Marte"]', 'print(planetas[1], len(planetas))'),
      opciones: [
        { texto: 'Venus 4', explicacion: 'Eso es: el índice 1 es el segundo elemento, y la lista tiene 4.' },
        { texto: 'Mercurio 4', explicacion: 'Se empieza a contar en 0: `planetas[0]` es Mercurio y `planetas[1]`, Venus.' },
        { texto: 'Venus 3', explicacion: '`len` cuenta los elementos, que son 4. El índice más alto es 3, pero eso es otra cosa.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'for-range', planeta: 'tierra', orden: 2,
    titulo: 'for y range: repetir',
    bloques: [
      { tipo: 'texto', texto: 'Imagina comprobar 10 sistemas escribiendo 10 `print`. ¿Y si fueran 1000? Un **bucle** repite un bloque de código. `for` recorre una secuencia y, en cada vuelta, guarda el elemento en una variable.' },
      { tipo: 'codigo', codigo: c(
        'for planeta in ["Mercurio", "Venus", "Tierra"]:',
        '    print("Rumbo a", planeta)',
        '',
        'for segundo in range(3, 0, -1):',
        '    print(segundo)',
        'print("¡Despegue!")',
      ), pista: 'Cambia el segundo bucle a `range(5)` y mira qué números salen.' },
      { tipo: 'texto', texto: c(
        'La función `range` fabrica secuencias de números, y es la pareja habitual de `for`.',
        '- `range(5)` → 0, 1, 2, 3, 4: empieza en 0 y **no incluye** el 5.',
        '- `range(1, 11)` → del 1 al 10.',
        '- `range(3, 0, -1)` → 3, 2, 1: el tercer número es el paso.',
        '',
        'Lo que va **sangrado** debajo del `for` se repite en cada vuelta. `print("¡Despegue!")` no está sangrado: se ejecuta una vez, al acabar el bucle.',
      ) },
      { tipo: 'error', texto: 'Olvidar que `range` no incluye el final: `range(1, 10)` llega hasta el 9, no hasta el 10. Para contar del 1 al 10 se escribe `range(1, 11)`.',
        codigo: 'for i in range(1, 10):\n    print(i)' },
    ],
    pregunta: {
      codigo: c('for i in range(2, 5):', '    print(i)'),
      opciones: [
        { texto: '2\n3\n4', explicacion: 'Correcto: empieza en 2 y para antes del 5.' },
        { texto: '2\n3\n4\n5', explicacion: '`range` no incluye el número final: para antes del 5.' },
        { texto: '0\n1\n2\n3\n4', explicacion: 'Con dos números, `range` empieza en el primero, 2, no en 0.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'contadores', planeta: 'tierra', orden: 5,
    titulo: 'Contadores y acumuladores',
    bloques: [
      { tipo: 'texto', texto: c(
        'Muchísimos programas hacen lo mismo: recorrer datos y **llevar la cuenta**. Para eso se crea una variable **antes** del bucle y se actualiza en cada vuelta.',
        '- Un **contador** suma 1 cada vez que algo se cumple.',
        '- Un **acumulador** va sumando valores.',
      ) },
      { tipo: 'codigo', codigo: c(
        'consumos = [120, 340, 80, 210]',
        'total = 0',
        'grandes = 0',
        '',
        'for litros in consumos:',
        '    total = total + litros',
        '    if litros > 150:',
        '        grandes += 1',
        '',
        'print("Total:", total)',
        'print("Módulos que gastan más de 150:", grandes)',
      ), pista: 'Añade un módulo de 500 litros a la lista.' },
      { tipo: 'texto', texto: '`grandes += 1` es una forma corta de escribir `grandes = grandes + 1`. Funciona igual con `-=` o `*=`.' },
      { tipo: 'error', texto: 'Crear el contador **dentro** del bucle. Se vuelve a poner a cero en cada vuelta y al final solo queda el último valor.',
        codigo: 'for litros in [120, 340, 80]:\n    total = 0\n    total = total + litros\nprint(total)' },
    ],
    pregunta: {
      codigo: c('cuenta = 0', 'for n in [3, 8, 1, 9]:', '    if n > 2:', '        cuenta += 1', 'print(cuenta)'),
      opciones: [
        { texto: '3', explicacion: 'Eso es: el 3, el 8 y el 9 son mayores que 2; el 1 no.' },
        { texto: '4', explicacion: 'El 1 no es mayor que 2, así que no cuenta.' },
        { texto: '20', explicacion: 'Eso sería sumar los números. Aquí `cuenta` suma 1 cada vez que se cumple la condición.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'while', planeta: 'tierra', orden: 8,
    titulo: 'while y break: repetir hasta que…',
    bloques: [
      { tipo: 'texto', texto: '`for` repite un número de veces conocido: una vez por elemento. Pero a veces no sabes cuántas vueltas harán falta: repostar **hasta que** el depósito esté lleno. Para eso está `while`: repite **mientras** se cumpla una condición.' },
      { tipo: 'codigo', codigo: c(
        'deposito = 20',
        'cargas = 0',
        '',
        'while deposito < 100:',
        '    deposito += 30',
        '    cargas += 1',
        '',
        'print("Cargas:", cargas, "- Depósito:", deposito)',
      ), pista: 'Empieza con el depósito a 90. ¿Cuántas cargas hacen falta?' },
      { tipo: 'texto', texto: 'Antes de cada vuelta, Python comprueba la condición; cuando deja de cumplirse, sigue después del bucle. Y `break` sale del bucle en ese momento, aunque la condición siga siendo cierta. Sirve para buscar algo y parar al encontrarlo.' },
      { tipo: 'codigo', codigo: c(
        'for clave in [4271, 1234, 9999]:',
        '    if clave == 1234:',
        '        print("Puerta abierta")',
        '        break',
        '    print("Probando", clave)',
      ) },
      { tipo: 'error', texto: 'El **bucle infinito**: si dentro del `while` nada cambia la condición, no acaba nunca. En AstroCode el programa se corta a los 5 segundos con «Time Limit Exceeded».',
        codigo: 'deposito = 20\nwhile deposito < 100:\n    print("Repostando...")' },
    ],
    pregunta: {
      codigo: c('n = 1', 'while n < 20:', '    n = n * 3', 'print(n)'),
      opciones: [
        { texto: '27', explicacion: 'Correcto: 1 → 3 → 9 → 27. Con 27 la condición ya no se cumple y el bucle para.' },
        { texto: '9', explicacion: 'Con 9 la condición aún se cumple (9 < 20), así que da una vuelta más: 27.' },
        { texto: '20', explicacion: '`n` se multiplica por 3 en cada vuelta, así que solo vale 1, 3, 9 y 27; nunca 20.' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'append-tuplas', planeta: 'tierra', orden: 11,
    titulo: 'Añadir a una lista: append, y las tuplas',
    bloques: [
      { tipo: 'texto', texto: 'Las listas pueden crecer. `append` añade un elemento **al final**. Es lo habitual para construir una lista con un bucle: empiezas con una lista vacía, `[]`, y vas añadiendo.' },
      { tipo: 'codigo', codigo: c(
        'senal = []',
        'for i in range(3):',
        '    senal.append("bip")',
        'print(senal)',
        '',
        'punto = (3, 7)',
        'x, y = punto',
        'print(x + y)',
        'print([("la", 2), ("silencio", 1)])',
      ), pista: 'Haz que la señal tenga 5 bips.' },
      { tipo: 'texto', texto: 'Una **tupla** es como una lista, pero con paréntesis y **sin poder cambiarla**. Sirve para agrupar datos que van juntos, como unas coordenadas `(x, y)` o una nota y su duración `("la", 2)`. Y se pueden **desempaquetar**: `x, y = punto` guarda cada valor en su variable.' },
      { tipo: 'error', texto: 'Guardar lo que devuelve `append`. `append` cambia la lista y devuelve `None`, así que con esto pierdes la lista. Se escribe sola: `senal.append("bip")`.',
        codigo: 'senal = []\nsenal = senal.append("bip")\nprint(senal)' },
    ],
    pregunta: {
      codigo: c('notas = ["do"]', 'notas.append("re")', 'notas.append("mi")', 'print(len(notas), notas[-1])'),
      opciones: [
        { texto: '3 mi', explicacion: 'Eso es: la lista queda ["do", "re", "mi"], y el último es «mi».' },
        { texto: '2 mi', explicacion: 'La lista ya empezaba con "do": con los dos añadidos tiene 3.' },
        { texto: '3 do', explicacion: '`append` añade al final, y `[-1]` es el último: «mi».' },
      ],
      correcta: 0,
    },
  },
  {
    clave: 'rejillas-rebanadas', planeta: 'tierra', orden: 14,
    titulo: 'Listas de listas y rebanadas',
    bloques: [
      { tipo: 'texto', texto: 'Una lista puede contener otras listas. Así se guarda una **rejilla**, como las de los retos alienígenas: una lista de filas, y cada fila es una lista de colores. `rejilla[1][2]` es la fila 1, columna 2.' },
      { tipo: 'codigo', codigo: c(
        'rejilla = [',
        '    [1, 0, 0],',
        '    [0, 2, 0],',
        '    [3, 0, 4],',
        ']',
        'print(rejilla[2][0])',
        'for fila in rejilla:',
        '    print(fila[::-1])',
      ), pista: 'Imprime `rejilla[1][1]` y luego `rejilla[::-1]`, la rejilla con las filas al revés.' },
      { tipo: 'texto', texto: c(
        'Las **rebanadas** sacan un trozo de una lista (o de un texto) con `[inicio:fin:paso]`.',
        '- `lista[1:3]` → de la posición 1 a la 2: el final no se incluye, como en `range`.',
        '- `lista[:2]` → los dos primeros.',
        '- `lista[::-1]` → toda la lista **al revés**.',
      ) },
      { tipo: 'error', texto: '`copia = fila` no copia la lista: las dos variables son **la misma**, y cambiar una cambia la otra. Para una copia de verdad: `copia = fila[:]`.',
        codigo: 'fila = [1, 2, 3]\ncopia = fila\ncopia[0] = 9\nprint(fila)' },
    ],
    pregunta: {
      codigo: c('datos = [10, 20, 30, 40, 50]', 'print(datos[1:3], datos[::-1][0])'),
      opciones: [
        { texto: '[20, 30] 50', explicacion: 'Correcto: las posiciones 1 y 2, y el primero de la lista dada la vuelta, que es el último.' },
        { texto: '[20, 30, 40] 50', explicacion: 'El final no se incluye: `[1:3]` son solo las posiciones 1 y 2.' },
        { texto: '[10, 20] 10', explicacion: 'Se cuenta desde 0, así que la posición 1 es el 20. Y `[::-1]` da la vuelta: su primer elemento es el 50.' },
      ],
      correcta: 0,
    },
  },
];
