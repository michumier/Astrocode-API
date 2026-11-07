# Temario de AstroCode (fase 10)

Este documento es la base de las fases 11 a 14. Recoge:
- qué se aprende en cada planeta;
- en qué orden van las lecciones y los ejercicios;
- dónde faltan ejercicios;
- cómo se reparten los puntos.

**Hay que revisarlo y aprobarlo antes de programar nada.**

## Por qué hace falta

Diagnóstico del 8-nov-2026, sobre los 43 ejercicios de la base de datos (38 de planeta y 5 retos diarios):

1. **La teoría no está conectada con nada.**
   - La Guía es un temario genérico de 12 conceptos que nadie lee en el momento en que lo necesita.
   - La mitad de esos conceptos no aparece en ningún ejercicio: archivos, excepciones, decoradores, generadores, módulos y programación asíncrona.
2. **El orden de cada planeta es casual.**
   - Los ejercicios de un nivel se reparten entre sus planetas por su número en la base de datos.
   - Así, Mercurio termina con la 💣 Bomba de cables, que exige métodos de texto, rebanadas (`[::-1]`), `%` y listas. Nada de eso se ha enseñado antes.
   - Al revés, la 🧬 Terraformación, cuya solución es una línea con `and`/`or`, está en Júpiter.
3. **Ningún ejercicio dice qué practicas ni para qué sirve.**
4. **Todo está abierto:** se puede empezar por el reto más difícil.

Para colocar cada ejercicio no me he fiado de su categoría. He analizado el código de su **solución de referencia** (qué construcciones de Python usa) y su **código base** (qué le damos hecho). Por ejemplo, todas las misiones y retos dan ya escrita la lectura de los datos (`altura = sensores["altura"]`), así que para hacerlos basta con saber rellenar una función.

## Decisiones (7-nov-2026)

- **Los planetas se abren al terminar el anterior**, no por puntos.
- **Los puntos se quedan para el ranking**: cada ejercicio sigue dando lo mismo que ahora.
- **Las lecciones dan puntos**, una sola vez.
- **Pregunta de comprobación en cada lección**: se decide viendo la lección de ejemplo del final de este documento.
- **Dentro de un planeta no se puede saltar**: la siguiente estrella se abre al completar la anterior. Lo comprueba también la API.
- **Los retos diarios siguen libres**, fuera de la ruta.

## La ruta, planeta a planeta

Leyenda:
- 📘 lección
- ✏️ ejercicio
- 🧩 reto
- 🚀 misión de pilotaje
- 🏁 final del planeta
- 🆕 hueco: ejercicio nuevo que hay que escribir (fase 13)

Entre paréntesis va el id del ejercicio y, si cambia de planeta, de dónde viene.

### ☿ Mercurio · «Primer contacto»
*Escribir un programa, guardar datos y hacer cuentas.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Tu primer programa: `print` y comentarios | |
| 2 | 📘 Variables: cajas con nombre | |
| 3 | ✏️ Variables espaciales básicas (#1) | crear una variable |
| 4 | 📘 Tipos de datos: números, texto y verdadero/falso | |
| 5 | ✏️ Registro de la nave espacial (#19, venía de Venus) | variables de varios tipos y f-strings |
| 6 | 📘 Operadores: `+ - * /`, `//` y `%` | |
| 7 | ✏️ Calculadora de combustible (#4) | operaciones encadenadas |
| 8 | 📘 Convertir tipos: `int()`, `float()`, `str()` | |
| 9 | ✏️ Telemetría: conversión de tipos (#2, venía de Marte) | conversiones y sus errores |
| 10 | 🏁🆕 **Informe de despegue** | todo lo anterior en un solo programa |

### ♀ Venus · «Tomar decisiones»
*Que el programa decida según los datos.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Comparar: `==`, `!=`, `<`, `>=` y los booleanos | |
| 2 | 📘 `if` y `else`: la nave decide | |
| 3 | ✏️ Recuento de satélites (#25, venía de la Tierra) | `if/else` con una comparación |
| 4 | 📘 `elif`: más de dos caminos | |
| 5 | 🆕 ✏️ **Semáforo de la plataforma** | `if/elif/else` puro |
| 6 | 📘 `and`, `or` y `not` | |
| 7 | 📘 Rellenar una función: parámetros y `return` | |
| 8 | ✏️ Comprobación del traje espacial (#16) | función con `if` y `.lower()`/`.strip()` |
| 9 | ✏️ Estado del sistema de soporte vital (#8, venía de Marte) | condiciones con `and`/`or` |
| 10 | 🧩 🧬 Terraformación (#73, venía de Júpiter) | una regla de una línea con `and`/`or` |
| 11 | 🧩 🎨 La bandera de Kepler (#68) | decidir el color por zonas con `//` |
| 12 | 🏁🚀 Aterrizaje de emergencia (#55, venía de Mercurio) | decidir 10 veces por segundo |

### 🜨 Tierra · «Repetir»
*Listas y bucles: hacer lo mismo con muchos datos.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Listas: muchos datos en una variable | |
| 2 | 📘 `for` y `range`: repetir | |
| 3 | ✏️ Verificación antes del lanzamiento (#10, venía de Mercurio) | `for` con `range` y `%` |
| 4 | ✏️ Listado de planetas explorados (#11, venía de Marte) | recorrer una lista con `enumerate` |
| 5 | 📘 Contadores y acumuladores | |
| 6 | ✏️ Cálculo del combustible necesario (#14, venía de Júpiter) | filtrar y sumar |
| 7 | ✏️ Clasificación de astronautas por edad (#17, venía de Júpiter) | dos contadores |
| 8 | 📘 `while` y `break`: repetir hasta que… | |
| 9 | 🆕 ✏️ **Repostaje hasta llenar** | `while` con condición de parada |
| 10 | ✏️ Contraseña de la nave (#28) | bucle de intentos en una función |
| 11 | 📘 Añadir a una lista: `append`, y las tuplas | |
| 12 | 🧩 🎵 SOS (#70) | construir una lista de pares |
| 13 | 🧩 🔐 La huella del PIN (#63, venía de Venus) | probar todas las posibilidades |
| 14 | 📘 Listas de listas y rebanadas (`[::-1]`) | |
| 15 | 🏁🧩 👽 El espejo (#60, venía de Mercurio) | transformar una rejilla |

### ♂ Marte · «Herramientas propias»
*Funciones propias y diccionarios: organizar el código y los datos.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Definir tus funciones: `def` desde cero | |
| 2 | 📘 `return` no es `print` | |
| 3 | ✏️ Gestión de misiones espaciales (#5) | varias funciones sobre una lista |
| 4 | ✏️ Monitor de oxígeno (#20, venía de Júpiter) | funciones con índices y `elif` |
| 5 | 📘 Diccionarios: datos con nombre | |
| 6 | 🆕 ✏️ **Inventario de la bodega** | crear, leer y recorrer un diccionario |
| 7 | 📘 Texto a fondo: `split`, `join`, `upper`, `in` | |
| 8 | ✏️ Códigos cifrados con Astro-Fibonacci (#9, venía de Saturno) | un bucle que recuerda los dos anteriores |
| 9 | 🧩 🎵 El transmisor morse (#71, venía de Júpiter) | traducir con un diccionario |
| 10 | 🏁🧩 💣 Bomba de cables (#58, venía de Mercurio) | seguir un manual de reglas con texto y listas |

### ♃ Júpiter · «Datos y algoritmos»
*Escribir menos y pensar mejor: comprensiones, ordenar y buscar.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Comprensiones de listas | |
| 2 | ✏️ Detección de señales anómalas (#21, venía de Saturno) | filtrar con una comprensión |
| 3 | 📘 Listas de diccionarios | |
| 4 | ✏️ Gestión avanzada de misiones y recursos (#18, venía de Saturno) | consultas sobre registros |
| 5 | 📘 Ordenar: `sorted`, `key` y `lambda` | |
| 6 | ✏️ Ordenar las distancias de planetas (#3, venía de Saturno) | ordenar con un criterio propio |
| 7 | ✏️ Matriz de sensores de los módulos (#6, venía de Saturno) | recorrer filas y columnas |
| 8 | 🧩 👽 La gravedad (#61, venía de Marte) | mover datos dentro de una rejilla |
| 9 | 🧩 🔍 Sabotaje en el reactor (#66, venía de Marte) | contar y cruzar datos de un registro |
| 10 | 🧩 🎨 Los anillos de Saturno (#69) | geometría con distancias |
| 11 | 📘 Buscar con cabeza: la búsqueda binaria | |
| 12 | 🧩 🔐 La cámara de Ceres (#64, venía de Marte) | partir el problema por la mitad |
| 13 | 🧩 💣 Bomba de módulos (#59, venía de Marte) | tres manuales a la vez |
| 14 | 🏁🚀 Cinturón de asteroides (#56, venía de Marte) | elegir el mejor carril en cada momento |

### ♄ Saturno · «Pensar como un ingeniero»
*Problemas grandes: recursión, objetos, grafos y estrategia.*

| # | Paso | Practica |
|---|---|---|
| 1 | 📘 Recursión: una función que se llama a sí misma | |
| 2 | 🆕 ✏️ **Cuenta atrás recursiva** | caso base y llamada recursiva |
| 3 | 📘 Clases y objetos: `class`, `__init__` y métodos | |
| 4 | 🆕 ✏️ **Tu propia nave** (`class Nave`) | crear y usar objetos |
| 5 | 📘 Recorrer una rejilla: vecinos y búsqueda en anchura | |
| 6 | 🧩 👽 Los lagos (#62) | rellenar zonas cerradas |
| 7 | 🧩 🔍 El apagón (#67) | deducir con pistas incompletas |
| 8 | 🧩 🎵 La señal con ruido (#72) | corregir errores al decodificar |
| 9 | 📘 Estrategia: descartar posibilidades | |
| 10 | 🧩 🔐 La cerradura de combinación (#65) | el mejor intento posible |
| 11 | 🏁🚀 Recolector de cristales (#57) | planificar una ruta |

### Retos diarios (fuera de la ruta)

Siguen libres y rotan cada día:
- Invertir un árbol binario (#46);
- Validar paréntesis (#47);
- Encontrar el número faltante (#48);
- Comprimir una señal (#74);
- Dos señales que suman el objetivo (#75).

## Resumen

| Planeta | 📘 Lecciones | Ejercicios actuales | 🆕 Nuevos |
|---|---|---|---|
| Mercurio | 5 | 4 | 1 |
| Venus | 5 | 6 | 1 |
| Tierra | 6 | 8 | 1 |
| Marte | 4 | 5 | 1 |
| Júpiter | 4 | 10 | — |
| Saturno | 4 | 5 | 2 |
| **Total** | **28** | **38** (todos los de planeta) | **6** |

- Se usan los 38 ejercicios de planeta y ninguno se pierde.
- 25 de ellos cambian de planeta; se quedan donde estaban 13: #1, #4, #16, #68, #28, #70, #5, #69 y los cinco de Saturno.
- Los ids, los puntos y el progreso de cada ejercicio no cambian.

### Huecos (ejercicios nuevos, fase 13)

Llevarán solución, tests visibles y ocultos, y una comprobación de que el código base no los supera (como en la fase 7).

| Hueco | Planeta | Por qué hace falta |
|---|---|---|
| Informe de despegue | Mercurio | No hay ningún final que junte variables, cuentas, conversión y f-strings |
| Semáforo de la plataforma | Venus | Ningún ejercicio practica `elif` sin nada más |
| Repostaje hasta llenar | Tierra | **Ningún ejercicio** de los tres primeros planetas usa `while` |
| Inventario de la bodega | Marte | Los diccionarios aparecen en retos, pero nunca en un ejercicio básico |
| Cuenta atrás recursiva | Saturno | La recursión solo aparece en un reto diario |
| Tu propia nave | Saturno | Ninguna tarea pide escribir una clase |

## Puntos

| Qué | Puntos | Notas |
|---|---|---|
| Ejercicios, retos y misiones | Los de ahora | No cambian, para no desordenar el ranking |
| Lección leída | +10 | La primera vez |
| Pregunta de la lección acertada a la primera | +5 | Si fallas, explica por qué y puedes reintentar, pero ya sin el +5 |
| 🏁 Planeta conquistado | Mercurio +100 · Venus +150 · Tierra +200 · Marte +250 · Júpiter +300 · Saturno +400 | Al completar el último paso. Premia avanzar en la ruta, no solo acumular retos |

**Ranking:** sigue siendo el total de puntos. Las lecciones suman unos 400 en total y los bonus de planeta, 1400. Con eso, quien avanza en la ruta queda por delante de quien solo juega a los retos sueltos.

**Planetas abiertos:**
- Un planeta se abre al completar **todos los pasos** del anterior, lecciones incluidas.
- En los retos y misiones basta con superarlos; no hace falta sacar 3 estrellas.

**Cuentas con progreso de antes** (fase 11):
- Cada ejercicio ya completado cuenta como hecho.
- Las lecciones anteriores a un ejercicio ya hecho cuentan como vistas, pero sin puntos.
- Así nadie se encuentra un candado delante de algo que ya había superado.

## Cada ejercicio, con «qué practicas» y «por qué»

Dos líneas nuevas encima del enunciado (fase 13) y un enlace a su lección. Por ejemplo:

> **Practicas:** `elif`, para elegir entre más de dos caminos.
> **Por qué:** casi ningún problema real es de sí o no. El ordenador de la nave distingue «normal», «aviso» y «peligro», y así lo hace cualquier programa que clasifica datos.

> **Practicas:** recorrer una lista con `for` y contar.
> **Por qué:** con dos datos los cuentas tú; con dos millones, un bucle. Así funciona cualquier estadística: una pasada por los datos y un contador.

## Lección de ejemplo (para decidir el formato)

Esta es la lección 📘 «`if` y `else`: la nave decide» de Venus, entera y tal como se vería.

---

### `if` y `else`: la nave decide

Hasta ahora tus programas hacían siempre lo mismo, línea a línea. Pero el ordenador de una nave no puede ser así: si el combustible baja demasiado, tiene que **avisar**; si no, seguir callado. Para eso está `if`: **ejecuta un bloque solo si se cumple una condición.**

```python
combustible = 18

if combustible < 20:
    print("⚠️ Reserva de combustible")
    print("Vuelve a la base")
else:
    print("Combustible suficiente")

print("Fin del chequeo")
```

▶ **Pruébalo**: cambia `18` por `50` y vuelve a ejecutar.

Fíjate en tres cosas:

1. La condición termina en **dos puntos** (`:`).
2. Lo que depende del `if` va **sangrado**, con 4 espacios. Así sabe Python qué líneas están dentro.
3. `else` es «en cualquier otro caso». Es opcional, y nunca lleva condición.

`print("Fin del chequeo")` no está sangrado, así que se ejecuta siempre.

**🔧 El error típico**

```python
if combustible = 20:
```

`=` **guarda** un valor y `==` **compara**. Para preguntar «¿vale 20?» se escribe `if combustible == 20:`. Si usas un solo `=`, Python te avisa con un `SyntaxError`.

**❓ Comprueba que lo has entendido**

```python
oxigeno = 95
if oxigeno > 90:
    print("Normal")
print("Revisado")
```

¿Qué imprime?

- **A)** `Normal`
- **B)** `Normal` y luego `Revisado` ✅
- **C)** `Revisado`

*Si eliges A:* casi. `print("Revisado")` no está sangrado, así que no depende del `if` y se ejecuta siempre.
*Si eliges C:* 95 es mayor que 90, así que la condición se cumple y también se imprime `Normal`.

**Lo siguiente:** ✏️ Recuento de satélites. Usarás un `if/else` para avisar cuando la órbita esté llena.

---

**Formato de todas las lecciones:**
- una explicación de 2–3 minutos con un ejemplo espacial;
- un ejemplo ejecutable («Pruébalo»);
- «El error típico»;
- una pregunta «¿qué imprime?» con 3 opciones y la explicación de cada fallo;
- un enlace a lo siguiente.

Se guardan en la base de datos, así que se pueden corregir desde el panel de administración sin desplegar.

## Qué pasa con la Guía

La Guía pasa a ser la **Biblioteca** (fase 14): las lecciones que ya has visto, agrupadas por planeta, para repasar.

Lo que hoy está en la Guía y no está en la ruta queda en un apartado **«Para ir más allá»** fuera del camino principal, sin puntos:
- archivos;
- excepciones;
- decoradores;
- generadores;
- módulos;
- asíncrono.

## Lo que viene

| Fase | Qué | Depende de este documento en… |
|---|---|---|
| 11 · Ruta y candados | Orden de cada planeta en la base de datos, candados en la API y la web, apertura por planeta completado, bonus de planeta, migración de cuentas con progreso | El orden de los pasos y los puntos |
| 12 · Lecciones | Pantalla de lección (texto, «Pruébalo», pregunta), sus puntos, y las 16 lecciones de Mercurio, Venus y Tierra | El formato de la lección de ejemplo |
| 13 · Contenido completo | Las otras 12 lecciones, los 6 ejercicios nuevos y «qué practicas / por qué» en los 44 | Los huecos y el temario |
| 14 · Biblioteca | La Guía pasa a ser la Biblioteca y se crea «Para ir más allá» | El reparto de la Guía |
