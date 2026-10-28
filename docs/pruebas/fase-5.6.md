# Plan de pruebas — Fase 5.6 (🎵 La señal de radio)

Ramas: `feature/fase-5.6-radio` en Astrocode-API y Astrocode-web (salen de la 5.5). Diseño en `docs/diseno/fase-5-retos.md` §4.6.

Retos nuevos (migración `018_retos_radio`):

| Reto | Nivel | Categoría | Puntos | Función | Escenarios |
|---|---|---|---|---|---|
| **🎵 SOS** | Fácil | Bucles | 150 | `transmitir({"nota", "repeticiones"})` → lista de (nota, pulsos) | 2 visibles + 4 ocultos (otras notas, de 1 a 5 repeticiones) |
| **🎵 El transmisor morse** | Intermedio | Estructuras de Datos | 200 | `transmitir({"mensaje", "nota"})` con los tiempos del morse y cada palabra en la siguiente nota | 2 visibles + 5 ocultos (una letra, espacios dobles, signos, 16 palabras que dan la vuelta a la escala, cifras) |
| **🎵 La señal con ruido** | Difícil | Algoritmos Avanzados | 300 | `recibir(senal)` → texto: quitar estática, sumar silencios y leer con umbrales | 2 visibles + 6 ocultos (al azar, bordes con estática, duraciones en las fronteras 2, 3, 5 y 6, mucha estática) |

Novedad del motor: la función puede depender del escenario (R3 usa `recibir()` y no `transmitir()`); el runner la toma del primer escenario visible.

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_radio test_nebulosa test_impostor test_camara test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Los dos ejemplos del diseño: «et a» en si2 y la señal dañada que da «ET» | `test_radio.py` |
| A2 | SOS: 9 pitidos (1,1,1,3,3,3,1,1,1) y 4 de silencio al final de cada repetición | `test_radio.py` |
| A3 | Palabras: mayúsculas, espacios múltiples y signos ignorados (las palabras vacías no cuentan); la escala vuelve a do tras si2 | `test_radio.py` |
| A4 | **300 señales dañadas al azar se descifran todas bien** con la solución de referencia | `test_radio.py` |
| A5 | Los escenarios con `extremos` usan las fronteras 2, 3, 5 y 6; los `bordes` empiezan con estática | `test_radio.py` |
| A6 | Escenarios deterministas; R3 usa `recibir`; el material de R3 es solo la señal (nunca el texto) | `test_radio.py` y `14-retos-radio` |
| A7 | Las tres soluciones superan los 21 escenarios con ⭐⭐⭐ | `test_radio.py` (contenedor) |
| A8 | Primera diferencia: «En la posición 5 esperaba ("silencio", 3) y llegó ("silencio", 1)»; señal cortada («faltan») o con elementos de más («Sobran») | `test_radio.py` (contenedor) |
| A9 | Errores típicos que fallan: sin la vuelta de la escala, sin quitar signos, sin sumar silencios, umbral de palabra en 7 | `test_radio.py` (contenedor) |
| A10 | Validación: no lista, no pareja, nota inexistente, pulsos 0 o decimales, más de 4.000 elementos | `test_radio.py` (contenedor) |
| A11 | R3 compara sin distinguir mayúsculas ni espacios de más; si falla, dice la posición y el visor recibe el texto esperado | `test_radio.py` y `14-retos-radio` |
| A12 | Por GraphQL: formato `radio`, 6/6, 7/7 y 8/8 con las soluciones; el código base dice dónde está la primera diferencia | `14-retos-radio` |
| A13 | Regresión de las fases 0–5.5 | `01`–`13`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Pestaña 📻 Frecuencias del transmisor | Cada escenario con su `senal`, la pista objetivo y «🎧 Escuchar la señal objetivo»; al pulsar suena y avanza el cabezal |
| M2 | Transmisor con 1 de silencio entre letras | Pistas objetivo y tuya; la zona de la primera diferencia marcada en rojo y «Primera diferencia en la posición 7» |
| M3 | «🔊 Escuchar tu señal» | Suena (onda cuadrada filtrada con siseo), cabezal y osciloscopio animado |
| M4 | R3 con un texto con una errata | La señal recibida con su estática; el teletipo escribe letra a letra mientras suena; la letra errónea en rojo y «El mensaje era …» |
| M5 | Móvil (375 px) | Sin desplazamiento horizontal en el visor ni en el material |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A11 | ✅ 149/149 en Python (14 nuevas) | |
| A12–A13 | ✅ 113/113 e2e (6 nuevas) | Unitarias 8/8 |
| M1 | ✅ tras corregir | El mensaje «hola  tierra» se veía con un solo espacio (el HTML junta los espacios, y el doble espacio es parte del reto): ahora se enseña tal cual. Además, la pista desbordaba 2 px en horizontal por su borde |
| M2 | ✅ | La diferencia era un silencio: se sombrea su zona en las dos pistas |
| M3 | ✅ | Comprobado en el DOM: botón «Sonando…», cabezal y onda en el osciloscopio |
| M4 | ✅ | «HOLA TIERRO» con la «O» en rojo; «El mensaje era «HOLA TIERRA»» |
| M5 | ✅ | 375 px de ancho de página en las dos pestañas |

## 4. Notas
- El sonido se sintetiza con WebAudio (sin ficheros) y el `AudioContext` se crea dentro del clic, como pide iOS. Queda pendiente probarlo en un iPhone real.
- Todo lo que suena también se ve en las pistas: se puede resolver sin sonido.
