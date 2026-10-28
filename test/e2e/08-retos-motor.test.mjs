// Fase 5.0: motor de retos (argumentos, lotes, consultas y material público).
// Usa los retos de calibración que siembra la API con RETOS_DE_PRUEBA=1 (ver compose.e2e.yml).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo ticks estrellas metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto yaCompletada puntos mensaje ejecucion { status { description } } mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ tipo formato codigoBase mision { id formato funcion escenarios ocultos material } } }`;

const SUMA = 'def calibrar(a, b):\n    return a + b\n';
const REJILLA = 'def calibrar(x, y):\n    return (x + y) % 10\n';
const BINARIA = `def calibrar(sonda):
    bajo, alto = sonda.minimo, sonda.maximo
    while bajo <= alto:
        medio = (bajo + alto) // 2
        r = sonda.probar(medio)
        if r == "abierta":
            return medio
        if r == "mayor":
            bajo = medio + 1
        else:
            alto = medio - 1
`;
const FUERZA_BRUTA = `def calibrar(sonda):
    for n in range(sonda.minimo, sonda.maximo + 1):
        if sonda.probar(n) == "abierta":
            return n
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const facil = (await gql(`{ tareasPorNivel(nivelId: "1"){ id titulo tipo formato } }`, {}, T)).data.tareasPorNivel;
const reto = (titulo) => facil.find((t) => t.titulo === titulo);
const args = reto('🧪 Calibración: argumentos');
const lotes = reto('🧪 Calibración: lotes');
const consultas = reto('🧪 Calibración: consultas');

test('los retos de calibración existen con tipo «reto» y su formato', () => {
  for (const r of [args, lotes, consultas]) {
    assert.ok(r, 'reto de calibración no encontrado (¿RETOS_DE_PRUEBA=1?)');
    assert.equal(r.tipo, 'reto');
    assert.equal(r.formato, 'diagnostico');
  }
});

test('Tarea.mision de un reto da función y material solo de los visibles, sin secretos', async () => {
  const t = (await gql(INFO, { id: consultas.id }, T)).data.tarea;
  assert.equal(t.mision.id, 'diagnostico');
  assert.equal(t.mision.formato, 'diagnostico');
  assert.equal(t.mision.funcion, 'calibrar');
  assert.deepEqual(t.mision.escenarios, ['Rango de mil', 'Rango de un millón']);
  assert.equal(t.mision.ocultos, 2);
  const material = JSON.parse(t.mision.material);
  assert.equal(material.length, 2, 'solo los escenarios visibles');
  assert.deepEqual(material.map((m) => m.nombre), ['Rango de mil', 'Rango de un millón']);
  for (const m of material) {
    assert.deepEqual(Object.keys(m.material).sort(), ['explicacion', 'intentos', 'maximo', 'modo']);
  }
  // Nada de los ocultos: ni el rango de mil millones ni el de 50, ni semillas ni parámetros
  const texto = JSON.stringify(t);
  assert.ok(!texto.includes('1000000000'));
  assert.ok(!/semilla|params|secreto|oculto"?:\s*true/.test(texto));
});

test('las misiones de pilotaje siguen igual: formato «pilotaje», función piloto y sin material', async () => {
  const dificil = (await gql(`{ tareasPorNivel(nivelId: "1"){ id titulo tipo formato } }`, {}, T)).data.tareasPorNivel;
  const aterrizaje = dificil.find((x) => x.titulo === '🚀 Aterrizaje de emergencia');
  assert.equal(aterrizaje.formato, null);
  const t = (await gql(INFO, { id: aterrizaje.id }, T)).data.tarea;
  assert.equal(t.mision.formato, 'pilotaje');
  assert.equal(t.mision.funcion, 'piloto');
  assert.equal(t.mision.material, null);
});

test('argumentos: probar un escenario visible con detalle y enviar suma puntos', async () => {
  const p = (await gql(PROBAR, { id: args.id, c: SUMA, e: 1 }, T)).data.probarMision;
  assert.equal(p.total, 1);
  assert.equal(p.escenarios[0].nombre, 'Pareja B');
  assert.ok(p.escenarios[0].exito, p.escenarios[0].motivo);
  assert.equal(JSON.parse(p.escenarios[0].fotogramas).length, 4);

  const e = (await gql(ENVIAR, { id: args.id, c: SUMA, t: 20 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.puntos, 10 + Math.round((10 * 2) / 4)); // 3 estrellas
  assert.equal(e.mision.superados, 4);
  const ocultos = e.mision.escenarios.filter((x) => x.oculto);
  assert.equal(ocultos.length, 2);
  for (const o of ocultos) {
    assert.equal(o.fotogramas, null);
    assert.equal(o.escena, null);
    assert.equal(o.metricas, null);
    assert.deepEqual(o.registro, []);
  }
});

test('argumentos: una solución mala no aprueba y explica el escenario visible', async () => {
  const e = (await gql(ENVIAR, { id: args.id, c: 'def calibrar(a, b):\n    return a * b\n', t: 5 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, false);
  assert.match(e.mision.escenarios[0].motivo, /se esperaba/);
  // De los ocultos solo se dice que fallaron, no por qué
  assert.equal(e.mision.escenarios[2].motivo, 'La misión falló en este escenario oculto');
});

test('lotes: la rejilla de 48×48 se corrige entera', async () => {
  const p = (await gql(PROBAR, { id: lotes.id, c: REJILLA, e: 1 }, T)).data.probarMision;
  assert.ok(p.escenarios[0].exito, p.escenarios[0].motivo);
  assert.deepEqual(JSON.parse(p.escenarios[0].metricas), { aciertos: 2304, total: 2304 });
  const e = (await gql(ENVIAR, { id: lotes.id, c: REJILLA, t: 5 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
});

test('consultas: la búsqueda binaria abre todas; la fuerza bruta hace saltar la alarma', async () => {
  const bien = (await gql(ENVIAR, { id: consultas.id, c: BINARIA, t: 5 }, T)).data.enviarSolucion;
  assert.equal(bien.correcto, true, bien.mensaje);

  const p = (await gql(PROBAR, { id: consultas.id, c: FUERZA_BRUTA, e: 0 }, T)).data.probarMision;
  assert.equal(p.escenarios[0].exito, false);
  assert.match(p.escenarios[0].motivo, /alarma/i);
});

test('un reto no se puede abrir con la caja negra ni probar como reto si no lo es', async () => {
  const caja = await gql(`mutation($id:ID!,$c:String!){ trazarTest(tareaId:$id, codigo:$c, indiceTest:0){ error } }`,
    { id: args.id, c: SUMA }, T);
  assert.equal(codigoError(caja), 'BAD_USER_INPUT');

  const normal = (await gql(`{ tareasPorNivel(nivelId: "1"){ id tipo } }`, {}, T)).data.tareasPorNivel.find((x) => x.tipo === 'codigo');
  const r = await gql(PROBAR, { id: normal.id, c: SUMA, e: 0 }, T);
  assert.equal(codigoError(r), 'BAD_USER_INPUT');
});
