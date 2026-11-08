// Los ejercicios nuevos de la fase 13 se corrigen igual que en la API (services/correccion.ts):
// la solución tiene que pasar todos los tests y el código base no. Necesita Python 3 (como lecciones.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { ejerciciosNuevos } = require('../../dist/db/seeds/ejerciciosNuevos.js');
const { rutaInicial } = require('../../dist/db/seeds/ruta.js');
const { lecciones } = require('../../dist/db/seeds/lecciones.js');
const { leccionesFase13 } = require('../../dist/db/seeds/leccionesFase13.js');

const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

// Igual que normalizarSalida de la API: sin espacios al final de cada línea ni del texto
const normalizar = (s) => (s || '').replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();

// Desde un archivo main.py, como en el runner (inspect.getsource, por ejemplo, necesita el archivo)
const ejecutar = (codigo) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'astrocode-'));
  const archivo = path.join(dir, 'main.py');
  writeFileSync(archivo, codigo, 'utf8');
  const r = spawnSync(PYTHON, ['-I', '-X', 'utf8', archivo], { encoding: 'utf8', timeout: 15000, cwd: dir });
  rmSync(dir, { recursive: true, force: true });
  return { salida: normalizar(r.stdout), ok: r.status === 0, error: r.stderr };
};

// Cuántos tests pasa un código, con la misma lógica que corregirTarea
function corregir(codigo, tests) {
  const propia = ejecutar(codigo);
  if (!propia.ok) return { pasados: 0, detalle: propia.error };
  let pasados = 0;
  const fallos = [];
  for (const t of tests) {
    const r = ejecutar(t.codigo ? `${codigo}\n\n${t.codigo}` : codigo);
    let obtenido = r.salida;
    if (t.codigo && propia.salida && obtenido.startsWith(propia.salida)) obtenido = obtenido.slice(propia.salida.length).trim();
    if (r.ok && obtenido === normalizar(t.salida)) pasados++;
    else fallos.push(`${t.descripcion}: esperado ${JSON.stringify(t.salida)}, obtenido ${JSON.stringify(obtenido)} ${r.error || ''}`);
  }
  return { pasados, detalle: fallos.join('\n') };
}

test('son los 6 huecos del temario y ocupan su sitio libre en la ruta', () => {
  assert.deepEqual(ejerciciosNuevos.map((e) => [e.planeta, e.orden]),
    [['mercurio', 10], ['venus', 5], ['tierra', 9], ['marte', 6], ['saturno', 2], ['saturno', 4]]);
  for (const p of rutaInicial) {
    const ordenes = [
      ...p.pasos.map(([o]) => o),
      ...[...lecciones, ...leccionesFase13].filter((l) => l.planeta === p.clave).map((l) => l.orden),
      ...ejerciciosNuevos.filter((e) => e.planeta === p.clave).map((e) => e.orden),
    ];
    assert.equal(new Set(ordenes).size, ordenes.length, `números repetidos en ${p.clave}`);
  }
});

for (const e of ejerciciosNuevos) {
  test(`«${e.titulo}»: la solución pasa los tests, el código base no, y lleva qué practicas y por qué`, () => {
    assert.ok(e.tests.length >= 2 && e.tests.some((t) => t.oculto), 'necesita un test visible y alguno oculto');
    assert.equal(normalizar(ejecutar(e.solucion).salida), normalizar(e.resultadoEsperado), 'la solución no imprime el resultado esperado');
    const solucion = corregir(e.solucion, e.tests);
    assert.equal(solucion.pasados, e.tests.length, solucion.detalle);
    const base = corregir(e.codigoBase, e.tests);
    assert.ok(base.pasados < e.tests.length, 'el código base no debería superar el ejercicio');
    assert.ok(e.practica.length > 10 && e.porque.length > 40);
  });
}
