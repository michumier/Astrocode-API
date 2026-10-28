// Detector de pistas que revelan la regla de la lengua alienígena y recorte de frases
// (sobre el JS compilado: npm run test:unit). Ejemplos sacados de pistas reales de NVIDIA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { revelaReglaLengua, recortarAFraseCompleta } = require('../../dist/services/ia.js');

test('delata la regla: pistas reales que se pasaban en el nivel 2', () => {
  assert.equal(revelaReglaLengua('La "gravedad" actúa sobre las **columnas**: los colores "caen" hacia abajo y los ceros suben.', 'gravedad'), true);
  assert.equal(revelaReglaLengua('Haz un "flood fill" (BFS/DFS) desde **todos los bordes** para marcar qué celdas son mar.', 'lagos'), true);
  assert.equal(revelaReglaLengua('Observa si el patrón se **invierte** de izquierda a derecha.', 'espejo'), true);
  assert.equal(revelaReglaLengua('Prueba con `fila[::-1]`.', 'espejo'), true);
  assert.equal(revelaReglaLengua('Solo pintan el agua que queda ATRAPADA dentro de los muros.', 'lagos'), true);
  assert.equal(revelaReglaLengua('Hay zonas negras que **permanecen negras** porque están conectadas con el borde de la rejilla.', 'lagos'), true);
});

test('no salta con pistas que solo ayudan a observar', () => {
  assert.equal(revelaReglaLengua('¿La **forma** de la rejilla cambia o se mantiene? ¿Los colores son los mismos pero en otra posición?', 'espejo'), false);
  assert.equal(revelaReglaLengua('Fíjate en las **columnas**: ¿cuántas celdas de color tiene cada una antes y después?', 'gravedad'), false);
  assert.equal(revelaReglaLengua('¿Qué diferencia hay entre el negro que toca el borde y el que está rodeado de gris?', 'lagos'), false);
  // Las palabras de otra variante no cuentan
  assert.equal(revelaReglaLengua('Los colores caen hacia abajo.', 'espejo'), false);
  assert.equal(revelaReglaLengua('Lo que sea', 'bomba'), false);
});

test('recortarAFraseCompleta quita la frase cortada por el límite de tokens', () => {
  assert.equal(recortarAFraseCompleta('Compara la entrada y la salida. ¿Qué cambia? ¡Observa bien'), 'Compara la entrada y la salida. ¿Qué cambia?');
  assert.equal(recortarAFraseCompleta('Todo correcto. 🚀'), 'Todo correcto. 🚀');
  assert.equal(recortarAFraseCompleta('Fíjate en **la forma**'), 'Fíjate en **la forma**');
  // Si casi todo es la frase cortada, mejor dejarla que quedarse con nada
  assert.equal(recortarAFraseCompleta('Sí. Esta frase larguísima se cortó a medias porque el modelo siguió escribiendo sin'), 'Sí. Esta frase larguísima se cortó a medias porque el modelo siguió escribiendo sin');
});
