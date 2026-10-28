// Fase 5.5: 🎨 Pinta la nebulosa (una llamada por píxel, en lotes)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ codigoBase mision { formato funcion escenarios ocultos material } } }`;

const BANDERA = `def color(x, y, ancho, alto):
    radio = min(ancho, alto) // 4
    if (x + 0.5 - ancho / 2) ** 2 + (y + 0.5 - alto / 2) ** 2 <= radio ** 2:
        return "amarillo"
    if x * 3 // ancho == 1:
        return "naranja"
    return "morado"
`;
// Error típico: pintar solo para el lienzo de 48×48
const BANDERA_FIJA = `def color(x, y, ancho, alto):
    if (x + 0.5 - 24) ** 2 + (y + 0.5 - 24) ** 2 <= 12 ** 2:
        return "amarillo"
    if x * 3 // 48 == 1:
        return "naranja"
    return "morado"
`;
const ANILLOS = `import math

def color(x, y, ancho, alto):
    u = max(1, min(ancho, alto) // 8)
    px, py = x + 0.5, y + 0.5
    if (px - ancho * 0.75) ** 2 + (py - alto * 0.25) ** 2 <= u ** 2:
        return "amarillo"
    dx, dy = px - ancho / 2, py - alto / 2
    if dx * dx + dy * dy <= (2 * u) ** 2:
        return "naranja"
    k = int(math.sqrt(dx * dx + (2 * dy) ** 2) // u)
    if 3 <= k <= 6:
        return "cian" if k % 2 else "azul"
    return "negro"
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const bandera = await buscar(1, '🎨 La bandera de Kepler');
const anillos = await buscar(2, '🎨 Los anillos de Saturno');

test('las dos nebulosas existen con formato «nebulosa» en su nivel', () => {
  for (const t of [bandera, anillos]) {
    assert.ok(t, 'reto no encontrado');
    assert.equal(t.tipo, 'reto');
    assert.equal(t.formato, 'nebulosa');
  }
});

test('el material trae la imagen objetivo de cada lienzo visible', async () => {
  const info = (await gql(INFO, { id: bandera.id }, T)).data.tarea.mision;
  assert.equal(info.funcion, 'color');
  assert.equal(info.ocultos, 4);
  const material = JSON.parse(info.material);
  assert.deepEqual(material.map((m) => [m.material.ancho, m.material.alto]), [[48, 48], [64, 32]]);
  assert.equal(material[1].material.objetivo.length, 64 * 32);
});

test('N1: la bandera exacta en los 6 lienzos', async () => {
  const e = (await gql(ENVIAR, { id: bandera.id, c: BANDERA, t: 30 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 6);
  assert.equal(e.mision.estrellas, 3);
});

test('N1: pintar solo para 48×48 falla en los lienzos de otros tamaños', async () => {
  const e = (await gql(ENVIAR, { id: bandera.id, c: BANDERA_FIJA, t: 30 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, false);
  assert.equal(e.mision.escenarios[0].exito, true);
  assert.ok(e.mision.escenarios.some((x) => x.oculto && !x.exito));
});

test('N1: el código base explica cuánto coincide y el visor recibe la imagen', async () => {
  const t = (await gql(INFO, { id: bandera.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: bandera.id, c: t.codigoBase, e: 1 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /Coinciden el [\d,]+ % de los píxeles/);
  const imagen = JSON.parse(e.fotogramas).at(-1).imagen;
  assert.equal(imagen.length, 64 * 32);
  assert.equal(JSON.parse(e.escena).objetivo.length, imagen.length);
});

test('N2: los anillos de Saturno con ⭐⭐⭐', async () => {
  const e = (await gql(ENVIAR, { id: anillos.id, c: ANILLOS, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 6);
  assert.equal(e.mision.estrellas, 3);
  assert.equal(e.puntos > 0, true);
});
