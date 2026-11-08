// Pruebas unitarias del cálculo de la ruta de aprendizaje (sobre el JS compilado: npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { calcularRuta } = require('../../dist/services/ruta.js');

const PLANETAS = [
  { clave: 'mercurio', nombre: 'Mercurio', tema: '', orden: 1, bonus: 100 },
  { clave: 'venus', nombre: 'Venus', tema: '', orden: 2, bonus: 150 },
  { clave: 'tierra', nombre: 'Tierra', tema: '', orden: 3, bonus: 200 },
];
const PASOS = [
  { planeta: 'mercurio', orden: 3, tipo: 'tarea', tareaId: 1 },
  { planeta: 'mercurio', orden: 5, tipo: 'tarea', tareaId: 2 },
  { planeta: 'venus', orden: 3, tipo: 'tarea', tareaId: 10 },
  { planeta: 'venus', orden: 8, tipo: 'tarea', tareaId: 11 },
  { planeta: 'tierra', orden: 3, tipo: 'tarea', tareaId: 20 },
];
const ruta = (hechas, { conquistados = [], candados = true } = {}) =>
  calcularRuta(PLANETAS, PASOS, new Set(hechas), new Set(conquistados), candados);
const estados = (r) => Object.fromEntries(r.map((p) => [p.clave, `${p.estado}: ${p.pasos.map((s) => s.estado).join(',')}`]));

test('quien empieza: solo el primer paso de Mercurio está abierto', () => {
  assert.deepEqual(estados(ruta([])), {
    mercurio: 'abierto: siguiente,bloqueado',
    venus: 'bloqueado: bloqueado,bloqueado',
    tierra: 'bloqueado: bloqueado',
  });
});

test('dentro de un planeta se avanza paso a paso', () => {
  assert.deepEqual(estados(ruta([1])).mercurio, 'abierto: hecho,siguiente');
});

test('al completar un planeta queda conquistado y se abre el siguiente', () => {
  const r = estados(ruta([1, 2]));
  assert.equal(r.mercurio, 'conquistado: hecho,hecho');
  assert.equal(r.venus, 'abierto: siguiente,bloqueado');
  assert.equal(r.tierra, 'bloqueado: bloqueado');
});

test('una conquista apuntada cuenta aunque luego se añadan pasos nuevos al planeta', () => {
  // Mercurio tiene un paso sin hacer (como cuando lleguen las lecciones), pero ya estaba conquistado
  const r = estados(ruta([1], { conquistados: ['mercurio'] }));
  assert.equal(r.mercurio, 'conquistado: hecho,siguiente');
  assert.equal(r.venus, 'abierto: siguiente,bloqueado');
});

test('progreso de antes de la ruta: lo hecho se respeta y nadie queda bloqueado delante de ello', () => {
  // Hizo el último paso de Venus sin haber terminado Mercurio
  const r = estados(ruta([11]));
  assert.equal(r.mercurio, 'abierto: siguiente,bloqueado');
  assert.equal(r.venus, 'abierto: siguiente,hecho');
});

test('sin candados (admins o RUTA_CANDADOS=0) todo está abierto y los pasos salen como pendientes', () => {
  assert.deepEqual(estados(ruta([], { candados: false })), {
    mercurio: 'abierto: siguiente,pendiente',
    venus: 'abierto: siguiente,pendiente',
    tierra: 'abierto: siguiente',
  });
});

test('un planeta sin pasos no se da por conquistado', () => {
  const r = calcularRuta(PLANETAS, [], new Set(), new Set(), true);
  assert.deepEqual(r.map((p) => p.estado), ['abierto', 'bloqueado', 'bloqueado']);
});

test('las lecciones son pasos como los demás: cuentan para avanzar y para conquistar', () => {
  const pasos = [
    { planeta: 'mercurio', orden: 1, tipo: 'leccion', tareaId: null, leccionId: 100 },
    { planeta: 'mercurio', orden: 3, tipo: 'tarea', tareaId: 1, leccionId: null },
    { planeta: 'venus', orden: 1, tipo: 'leccion', tareaId: null, leccionId: 200 },
  ];
  const r = (hechas, leidas) => estados(calcularRuta(PLANETAS, pasos, new Set(hechas), new Set(), true, new Set(leidas)));
  assert.equal(r([], []).mercurio, 'abierto: siguiente,bloqueado');
  assert.equal(r([], [100]).mercurio, 'abierto: hecho,siguiente');
  // La tarea sola no basta: falta la lección
  assert.equal(r([1], []).mercurio, 'abierto: siguiente,hecho');
  assert.equal(r([1], [100]).mercurio, 'conquistado: hecho,hecho');
  assert.equal(r([1], [100]).venus, 'abierto: siguiente');
});
