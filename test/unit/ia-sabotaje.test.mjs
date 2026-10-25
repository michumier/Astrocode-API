// Detector de pistas que revelan el sabotaje (sobre el JS compilado: npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { revelaSabotaje } = require('../../dist/services/ia.js');

// Formato del mutador (difflib de Python)
const DIFF_AST = `--- solucion.py
+++ saboteado.py
@@ -6,3 +6,3 @@
             elemento_pop = pila.pop() if pila else "#"
-            if mapa[char] != elemento_pop:
+            if mapa[char] == elemento_pop:
                 return False`;

// Formato de diffLineas (sabotajes de la IA)
const DIFF_IA = `-         if char in mapa:
+         if char in mapa.values():`;

const DIFF_POP = `-             elemento_pop = pila.pop() if pila else "#"
+             elemento_pop = pila.pop(0) if pila else "#"`;

test('menciona un número de línea', () => {
  assert.equal(revelaSabotaje('Revisa la línea 5, ahí está el fallo.', DIFF_IA), true);
  assert.equal(revelaSabotaje('mira la linea 12', DIFF_IA), true);
  assert.equal(revelaSabotaje('En la línea nº 3 hay algo raro', DIFF_IA), true);
});

test('cita el fragmento saboteado', () => {
  assert.equal(revelaSabotaje('¿Seguro que quieres usar `.values()` ahí?', DIFF_IA), true);
  assert.equal(revelaSabotaje('Fíjate en pop(0): saca el primero.', DIFF_POP), true);
  assert.equal(revelaSabotaje('La condición if mapa[char] == elemento_pop: está mal', DIFF_AST), true);
});

test('pistas generales no se consideran filtraciones', () => {
  assert.equal(revelaSabotaje('Revisa qué tipo de paréntesis debería activar la comprobación.', DIFF_IA), false);
  assert.equal(revelaSabotaje('Mira cómo se sacan los elementos de la pila.', DIFF_POP), false);
  assert.equal(revelaSabotaje('Hay una comparación que no hace lo que debería.', DIFF_AST), false);
});
