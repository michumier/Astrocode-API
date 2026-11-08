// El contenido de las lecciones se comprueba ejecutándolo (sobre el JS compilado: npm run test:unit).
// Necesita Python 3 (en Windows, `python`; en Linux, `python3`; se puede forzar con PYTHON=...).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { lecciones: fase12 } = require('../../dist/db/seeds/lecciones.js');
const { leccionesFase13 } = require('../../dist/db/seeds/leccionesFase13.js');
const lecciones = [...fase12, ...leccionesFase13];
const { rutaInicial } = require('../../dist/db/seeds/ruta.js');

const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

const ejecutar = (codigo) => {
  const r = spawnSync(PYTHON, ['-I', '-X', 'utf8', '-c', codigo], { encoding: 'utf8', timeout: 10000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  return { salida: (r.stdout || '').replace(/\r\n/g, '\n').trim(), error: r.stderr || '', codigo: r.status };
};

test('hay 28 lecciones con clave única, repartidas como en el temario', () => {
  assert.equal(lecciones.length, 28);
  assert.equal(new Set(lecciones.map((l) => l.clave)).size, 28);
  const por = (p) => lecciones.filter((l) => l.planeta === p).length;
  assert.deepEqual(['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno'].map(por), [5, 5, 6, 4, 4, 4]);
});

test('cada lección ocupa un hueco libre de la ruta (no choca con ningún ejercicio ni con otra lección)', () => {
  for (const p of rutaInicial) {
    const ordenes = [...p.pasos.map(([orden]) => orden), ...lecciones.filter((l) => l.planeta === p.clave).map((l) => l.orden)];
    assert.equal(new Set(ordenes).size, ordenes.length, `números repetidos en ${p.clave}`);
  }
});

for (const l of lecciones) {
  test(`«${l.titulo}»: los ejemplos se ejecutan y la respuesta correcta es lo que imprime`, () => {
    for (const b of l.bloques.filter((b) => b.tipo === 'codigo')) {
      const r = ejecutar(b.codigo);
      assert.equal(r.codigo, 0, `el ejemplo falla:\n${b.codigo}\n${r.error}`);
    }
    assert.equal(l.bloques.filter((b) => b.tipo === 'error').length, 1, 'cada lección lleva un error típico');

    const { codigo, opciones, correcta } = l.pregunta;
    assert.equal(opciones.length, 3);
    const r = ejecutar(codigo);
    assert.equal(r.codigo, 0, r.error);
    assert.equal(r.salida, opciones[correcta].texto, 'la opción correcta no es lo que imprime');
    opciones.forEach((o, i) => {
      if (i !== correcta) assert.notEqual(o.texto, r.salida, `la opción ${i} también sería correcta`);
      assert.ok(o.explicacion.length > 20, `falta la explicación de la opción ${i}`);
    });
  });
}
