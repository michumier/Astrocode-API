// Fase 2: misiones de pilotaje
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo ticks estrellas metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto yaCompletada puntos mensaje tests { total } ejecucion { stdout status { description } } mision { ${RESULTADO} } } }`;

const DOS_CONDICIONES = `def piloto(sensores):
    altura = sensores["altura"]
    velocidad = sensores["velocidad"]
    print("altura", round(altura))
    if velocidad < -6 or (altura < 25 and velocidad < -1.5):
        return {"empuje": 1}
    return {"empuje": 0}
`;

const CARRIL_LIBRE = `def piloto(s):
    c = s["carril"]
    opciones = [x for x in (c, c - 1, c + 1) if 0 <= x < s["carriles"]]
    mejor = max(opciones, key=lambda x: s["distancias"][x])
    return "mantener" if mejor == c else ("izquierda" if mejor < c else "derecha")
`;

const CRISTAL_CERCANO = `from collections import deque
M = {"N": (-1, 0), "S": (1, 0), "E": (0, 1), "O": (0, -1)}
def piloto(s):
    mapa, inicio = s["mapa"], tuple(s["posicion"])
    objetivos = {tuple(c) for c in s["cristales"]}
    previo = {inicio: None}
    cola = deque([inicio])
    while cola:
        a = cola.popleft()
        if a in objetivos:
            while previo[a] != inicio:
                a = previo[a]
            return next(n for n, (df, dc) in M.items() if (inicio[0] + df, inicio[1] + dc) == a)
        for df, dc in M.values():
            f, c = a[0] + df, a[1] + dc
            if 0 <= f < len(mapa) and 0 <= c < len(mapa[0]) and mapa[f][c] != "#" and (f, c) not in previo:
                previo[(f, c)] = a
                cola.append((f, c))
    return "N"
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const aterrizaje = await buscar(1, '🚀 Aterrizaje de emergencia');
const asteroides = await buscar(2, '☄️ Cinturón de asteroides');
const cristales = await buscar(3, '💎 Recolector de cristales');

test('las tres misiones existen como tareas de pilotaje en su nivel', () => {
  for (const m of [aterrizaje, asteroides, cristales]) {
    assert.ok(m, 'misión no encontrada');
    assert.equal(m.tipo, 'pilotaje');
  }
});

test('Tarea.mision da los escenarios visibles sin semillas ni datos ocultos', async () => {
  const r = await gql(`query($id:ID!){ tarea(id:$id){ codigoBase mision { id escenarios ocultos } } }`, { id: aterrizaje.id }, T);
  assert.deepEqual(r.data.tarea.mision, { id: 'aterrizaje', escenarios: ['Marte', 'Luna'], ocultos: 3 });
  assert.ok(!JSON.stringify(r).includes('semilla'));
  assert.match(r.data.tarea.codigoBase, /def piloto\(sensores\)/);
  const normal = await gql(`{ tarea(id: 1){ mision { id } } }`, {}, T);
  assert.equal(normal.data.tarea.mision, null);
});

test('probarMision: exige sesión y solo vale para misiones', async () => {
  assert.equal(codigoError(await gql(PROBAR, { id: aterrizaje.id, c: 'x', e: 0 })), 'UNAUTHENTICATED');
  assert.equal(codigoError(await gql(PROBAR, { id: '1', c: 'x', e: 0 }, T)), 'BAD_USER_INPUT');
});

test('probarMision: vuelo completo de un escenario visible con fotogramas, escena y registro', async () => {
  const r = (await gql(PROBAR, { id: aterrizaje.id, c: DOS_CONDICIONES, e: 1 }, T)).data.probarMision;
  assert.equal(r.total, 1);
  const e = r.escenarios[0];
  assert.equal(e.nombre, 'Luna');
  assert.equal(e.exito, true, e.motivo);
  const fotogramas = JSON.parse(e.fotogramas);
  assert.equal(fotogramas.length, e.ticks + 1);
  assert.ok(['h', 'v', 'c', 'e'].every((k) => k in fotogramas[0]));
  assert.equal(JSON.parse(e.escena).gravedad, 1.62);
  assert.match(e.registro[0].texto, /^altura \d+/);
  assert.ok(JSON.parse(e.metricas).combustible_restante > 0);
});

test('enviar sin motor: se estrella; los ocultos no dan detalle', async () => {
  const r = (await gql(ENVIAR, { id: aterrizaje.id, c: 'def piloto(s):\n    return {"empuje": 0}', t: 5 }, T)).data.enviarSolucion;
  assert.equal(r.correcto, false);
  assert.equal(r.tests, null);
  assert.equal(r.mision.superados, 0);
  assert.equal(r.mision.total, 5);
  assert.match(r.mensaje, /0 de 5 escenarios/);
  const [marte, , oculto] = r.mision.escenarios;
  assert.match(marte.motivo, /Impacto a [\d.]+ m\/s/);
  assert.ok(marte.fotogramas);
  assert.equal(oculto.oculto, true);
  assert.equal(oculto.fotogramas, null);
  assert.equal(oculto.escena, null);
  assert.equal(oculto.metricas, null);
  assert.equal(oculto.motivo, 'La misión falló en este escenario oculto');
});

test('memorizar el vuelo de un escenario visible no sirve en los ocultos', async () => {
  const vuelo = (await gql(PROBAR, { id: aterrizaje.id, c: DOS_CONDICIONES, e: 0 }, T)).data.probarMision.escenarios[0];
  const empujes = JSON.parse(vuelo.fotogramas).slice(1).map((f) => f.e);
  const memorizado = `E = ${JSON.stringify(empujes)}\ndef piloto(s):\n    t = s["tick"]\n    return E[t] if t < len(E) else 1\n`;
  const r = (await gql(ENVIAR, { id: aterrizaje.id, c: memorizado, t: 5 }, T)).data.enviarSolucion;
  assert.equal(r.mision.escenarios[0].exito, true, 'en su escenario sí aterriza');
  assert.equal(r.correcto, false);
  assert.ok(r.mision.escenarios.filter((e) => e.oculto).some((e) => !e.exito));
});

test('bucle infinito en el piloto: mensaje claro y el intento queda como Timeout', async () => {
  const r = (await gql(ENVIAR, { id: aterrizaje.id, c: 'def piloto(s):\n    while True:\n        pass', t: 5 }, T)).data.enviarSolucion;
  assert.equal(r.correcto, false);
  assert.match(r.mision.escenarios[0].motivo, /no respondió a tiempo/);
  assert.equal(r.ejecucion.status.description, 'Time Limit Exceeded');
  const intentos = (await gql(`query($id:ID!){ misIntentos(tareaId:$id, limite: 1){ tipoError testsSuperados testsTotales } }`, { id: aterrizaje.id }, T)).data.misIntentos;
  assert.deepEqual(intentos[0], { tipoError: 'Timeout', testsSuperados: 0, testsTotales: 5 });
});

test('aterrizaje resuelto: correcto, estrellas y puntos con bonus; repetir no suma', async () => {
  const otro = await nuevoAlumno();
  const r = (await gql(ENVIAR, { id: aterrizaje.id, c: DOS_CONDICIONES, t: 90 }, otro.token)).data.enviarSolucion;
  assert.equal(r.correcto, true, r.mensaje);
  assert.equal(r.mision.superados, 5);
  assert.equal(r.mision.estrellas, 2);
  assert.equal(r.puntos, 150 + Math.round(150 / 4));
  const otraVez = (await gql(ENVIAR, { id: aterrizaje.id, c: DOS_CONDICIONES, t: 91 }, otro.token)).data.enviarSolucion;
  assert.equal(otraVez.yaCompletada, true);
  assert.equal(otraVez.puntos, 0);
  const intentos = (await gql(`query($id:ID!){ misIntentos(tareaId:$id){ correcto tipoError } }`, { id: aterrizaje.id }, otro.token)).data.misIntentos;
  assert.deepEqual(intentos[1], { correcto: true, tipoError: null });
});

test('asteroides y cristales se resuelven con sus estrategias de referencia', async () => {
  const otro = await nuevoAlumno();
  for (const [tarea, codigo] of [[asteroides, CARRIL_LIBRE], [cristales, CRISTAL_CERCANO]]) {
    const r = (await gql(ENVIAR, { id: tarea.id, c: codigo, t: 60 }, otro.token)).data.enviarSolucion;
    assert.equal(r.correcto, true, `${tarea.titulo}: ${r.mensaje} ${JSON.stringify(r.mision?.escenarios.map((e) => e.motivo))}`);
    assert.ok(r.mision.estrellas >= 1);
  }
});

test('acción no válida y return olvidado dan mensajes claros', async () => {
  let r = (await gql(PROBAR, { id: asteroides.id, c: 'def piloto(s):\n    return "arriba"', e: 0 }, T)).data.probarMision;
  assert.match(r.escenarios[0].motivo, /"izquierda", "derecha" o "mantener"/);
  r = (await gql(PROBAR, { id: cristales.id, c: 'def piloto(s):\n    s["posicion"]', e: 0 }, T)).data.probarMision;
  assert.match(r.escenarios[0].motivo, /devolvió None/);
});

test('pistas en misiones: la IA no recibe la solución hasta el nivel 3', async () => {
  const PISTA = `mutation($id:ID!,$c:String!,$n:Int){ pedirPista(tareaId:$id, codigo:$c, nivel:$n){ pista } }`;
  const codigo = 'def piloto(s):\n    return "mantener"';
  const p1 = await gql(PISTA, { id: asteroides.id, c: codigo, n: 1 }, T);
  assert.match(p1.data.pedirPista.pista, /mision, solucion no/);
  const p3 = await gql(PISTA, { id: asteroides.id, c: codigo, n: 3 }, T);
  assert.match(p3.data.pedirPista.pista, /mision, solucion si/);
});
