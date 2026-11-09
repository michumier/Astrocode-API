# Plan de pruebas — Fase 14 (📚 Biblioteca)

Rama `feature/fase-14-biblioteca` en Astrocode-web. La API no cambia: en esta rama solo van este plan y el roadmap.

## Qué cambia

La **Guía de Python pasa a ser la Biblioteca** (`views/biblioteca/`, en `/biblioteca`):
- **Tus lecciones**:
  - las 28 lecciones de la ruta, agrupadas por planeta con su tema y su cuenta («1 de 5»);
  - las vistas se pueden repasar, la siguiente se puede empezar y el resto dice «Aún no has llegado»;
  - arriba, el total: «1 de 28 vistas».
  - Usa la consulta `ruta`, así que respeta los mismos candados que el mapa.
- **Para ir más allá**:
  - los 6 temas de la antigua Guía que no entran en la ruta: excepciones, archivos, módulos, generadores, decoradores y programación asíncrona;
  - textos reescritos, con «cuándo te lo vas a encontrar»;
  - ejemplos que funcionan. Antes, el de módulos importaba `requests` y un módulo inexistente, y el de excepciones pedía `input()`.
  - No dan puntos.
- **Para seguir aprendiendo**: los recursos externos de siempre.
- **Enlaces**:
  - la barra dice «Biblioteca»;
  - el panel del mapa dice «Biblioteca: repasa las lecciones que ya has visto»;
  - **`/guia` redirige a `/biblioteca`**, para que no se rompa ningún enlace antiguo.
- Los temas básicos e intermedios de la Guía (variables, bucles, funciones, clases…) ya están en las lecciones de la ruta, mejor explicados.

## Pruebas automáticas

| Prueba | Resultado |
|---|---|
| Web: `npx tsc --noEmit` | ✅ |
| Web: pruebas, con 3 de la Biblioteca en lugar de las de la Guía | ✅ **52/52** |
| Web: `CI=true react-scripts build` | ✅ sin avisos |
| Los 6 ejemplos de «Para ir más allá» ejecutados con Python | ✅ los 6 terminan bien |

Las 3 pruebas de la Biblioteca comprueban:
- lecciones agrupadas por planeta: «Repasar» y «Empezar» enlazan a `/leccion/:id`, las bloqueadas no tienen enlace y los ejercicios no salen;
- los 6 temas de «Para ir más allá», con su índice, «cuándo» y código coloreado;
- los recursos se abren en otra pestaña con `rel="noopener noreferrer"`.

## Pruebas manuales (pila aislada, web en :3100)

| Paso | Resultado |
|---|---|
| Alumno con la lección 1 completada abre `/guia` | ✅ redirige a `/biblioteca` |
| Barra superior | ✅ Mapa · Biblioteca · Ranking |
| Tus lecciones | ✅ «1 de 28 vistas»; Mercurio «Primer contacto · 1 de 5» con Repasar / Empezar / «Aún no has llegado»; los 6 planetas |
| Para ir más allá | ✅ los 6 temas |

## Con esta fase termina el bloque 10–14

Ruta de aprendizaje completa:
- **temario**;
- **ruta con candados** y planetas que se conquistan;
- **28 lecciones** con su pregunta;
- **44 ejercicios** con «qué practicas / por qué»;
- **Biblioteca** para repasar.
