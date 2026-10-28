// Fase 5.3: 🔐 Cámara acorazada (huella, búsqueda binaria y combinación)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ codigoBase mision { formato funcion escenarios ocultos material } } }`;

const HUELLA = `import hashlib

def huella(texto):
    return hashlib.sha256(texto.encode()).hexdigest()

def abrir(caja):
    candidatos = caja["candidatos"]
    if candidatos is None:
        candidatos = [str(n).zfill(caja["cifras"]) for n in range(10 ** caja["cifras"])]
    for pin in candidatos:
        if huella(pin) == caja["huella"]:
            return pin
`;
const BINARIA = `def abrir(caja):
    bajo, alto = caja.minimo, caja.maximo
    while bajo <= alto:
        medio = (bajo + alto) // 2
        r = caja.probar(medio)
        if r == "abierta":
            return medio
        if r == "mayor":
            bajo = medio + 1
        else:
            alto = medio - 1
`;
const FUERZA_BRUTA = `def abrir(caja):
    for n in range(caja.minimo, caja.maximo + 1):
        if caja.probar(n) == "abierta":
            return n
`;
const COMBINACION = `from itertools import permutations

def comparar(intento, secreto):
    exactos = sum(a == b for a, b in zip(intento, secreto))
    comunes = len(set(intento) & set(secreto))
    return {"exactos": exactos, "descolocados": comunes - exactos}

def abrir(caja):
    posibles = ["".join(p) for p in permutations("0123456789", 4)]
    while posibles:
        intento = posibles[0]
        r = caja.probar(intento)
        if r == "abierta":
            return intento
        posibles = [p for p in posibles if comparar(intento, p) == r]
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const huella = await buscar(1, '🔐 La huella del PIN');
const ceres = await buscar(2, '🔐 La cámara de Ceres');
const combinacion = await buscar(3, '🔐 La cerradura de combinación');

test('las tres cámaras existen con formato «camara» en su nivel', () => {
  for (const t of [huella, ceres, combinacion]) {
    assert.ok(t, 'cámara no encontrada');
    assert.equal(t.tipo, 'reto');
    assert.equal(t.formato, 'camara');
  }
});

test('el material de cada cámara es público: nunca el PIN ni el secreto', async () => {
  for (const t of [huella, ceres, combinacion]) {
    const info = (await gql(INFO, { id: t.id }, T)).data.tarea.mision;
    assert.equal(info.funcion, 'abrir');
    assert.equal(info.escenarios.length, 2);
    assert.equal(info.ocultos, 6);
    assert.ok(!/"pin"|secreto|semilla|posicion|repetido/.test(info.material), info.material.slice(0, 200));
  }
  // La cámara de Ceres visible tiene secreto 731: no debe aparecer en el material
  assert.ok(!(await gql(INFO, { id: ceres.id }, T)).data.tarea.mision.material.includes('731'));
});

test('C1: la fuerza bruta con huellas abre las 8 cámaras', async () => {
  const e = (await gql(ENVIAR, { id: huella.id, c: HUELLA, t: 40 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje + JSON.stringify(e.mision.escenarios.map((x) => x.motivo)));
  assert.equal(e.mision.superados, 8);
});

test('C1: devolver el código base explica que no es el PIN y lo revela en el visible', async () => {
  const t = (await gql(INFO, { id: huella.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: huella.id, c: t.codigoBase, e: 0 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /no es el PIN/);
  assert.match(JSON.parse(e.fotogramas).at(-1).pin, /^\d{4}$/);
});

test('C2: la búsqueda binaria abre todas; la fuerza bruta hace saltar la alarma', async () => {
  const bien = (await gql(ENVIAR, { id: ceres.id, c: BINARIA, t: 40 }, T)).data.enviarSolucion;
  assert.equal(bien.correcto, true, bien.mensaje);
  assert.equal(bien.mision.superados, 8);
  const p = (await gql(PROBAR, { id: ceres.id, c: FUERZA_BRUTA, e: 1 }, T)).data.probarMision;
  assert.equal(p.escenarios[0].exito, false);
  assert.match(p.escenarios[0].motivo, /alarma/i);
  const historial = JSON.parse(p.escenarios[0].fotogramas).at(-1).historial;
  assert.equal(historial.length, 20);
});

test('C3: la deducción abre las 8 cerraduras; las estrellas dependen del peor caso', async () => {
  const e = (await gql(ENVIAR, { id: combinacion.id, c: COMBINACION, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 8);
  // Hay una cerradura oculta (9431) que esta estrategia abre en 9 intentos → 1 estrella
  assert.equal(e.mision.estrellas, 1);
  assert.equal(e.puntos, 300);
});

test('C3: el historial muestra cómo bajan las combinaciones posibles', async () => {
  const p = (await gql(PROBAR, { id: combinacion.id, c: COMBINACION, e: 0 }, T)).data.probarMision;
  const historial = JSON.parse(p.escenarios[0].fotogramas).at(-1).historial;
  assert.deepEqual(historial.map((h) => h.posibles), [1260, 288, 128, 21, 2, 1]);
  assert.deepEqual(JSON.parse(p.escenarios[0].metricas), { intentos: 6, limite: 10 });
});
