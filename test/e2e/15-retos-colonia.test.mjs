// Fase 5.7: 🧬 La colonia (la regla se convierte en tabla y el motor simula 40 generaciones)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ codigoBase mision { formato funcion escenarios ocultos material } } }`;

const REFERENCIA = `def regla(viva, vecinas):
    return viva or vecinas >= 2
`;
const INVADIR = `def regla(viva, vecinas):
    return viva or vecinas >= 1
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const colonia = (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: '2' }, T)).data.tareasPorNivel
  .find((t) => t.titulo === '🧬 Terraformación');

test('Terraformación existe con formato «colonia» y su mapa en el material', async () => {
  assert.ok(colonia, 'reto no encontrado');
  assert.equal(colonia.tipo, 'reto');
  assert.equal(colonia.formato, 'colonia');
  const info = (await gql(INFO, { id: colonia.id }, T)).data.tarea.mision;
  assert.equal(info.funcion, 'regla');
  assert.equal(info.ocultos, 4);
  const mapa = JSON.parse(info.material)[0].material;
  assert.equal(mapa.lado, 24);
  assert.equal(mapa.base.length, 16);
  assert.equal(mapa.objetivo.length, 16);
});

test('Co1: nacer con 2 o más vecinas cubre los 6 mapas con ⭐⭐⭐', async () => {
  const e = (await gql(ENVIAR, { id: colonia.id, c: REFERENCIA, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 6);
  assert.equal(e.mision.estrellas, 3);
  assert.equal(e.puntos > 0, true);
});

test('Co1: nacer con 1 vecina se cuela por la grieta y el visor se para en la infección', async () => {
  const p = (await gql(PROBAR, { id: colonia.id, c: INVADIR, e: 0 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /alcanzó la base en la generación \d+/);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.equal(final.generaciones.length, final.infectada + 1);
  assert.deepEqual(final.tabla.muerta, [false, true, true, true, true, true, true, true, true]);
});

test('Co1: el código base se queda sin crecer', async () => {
  const t = (await gql(INFO, { id: colonia.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: colonia.id, c: t.codigoBase, e: 1 }, T)).data.probarMision;
  assert.equal(p.escenarios[0].exito, false);
  assert.match(p.escenarios[0].motivo, /no cubrió toda la zona verde|se extinguió/);
});
