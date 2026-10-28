// Fase 5.4: 🔍 Hay un impostor a bordo (registro en bruto, diccionarios y grafo con BFS)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ codigoBase mision { formato funcion escenarios ocultos material } } }`;

const REACTOR = `def investigar(log):
    nombres, sala_de = {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA" and partes[2] in nombres and partes[-1] != "DENEGADO":
            sala_de[partes[2]] = partes[5]
        elif tipo == "ALERTA" and partes[2] == "SABOTAJE":
            return [nombres[t] for t, s in sala_de.items() if s == partes[3]][0]
`;
// Error típico: no mirar si la puerta se abrió
const REACTOR_SIN_DENEGADO = REACTOR.replace(' and partes[-1] != "DENEGADO"', '');

const APAGON = `from collections import deque

def minutos(marca):
    hh, mm = marca.strip("[]").split(":")
    return int(hh) * 60 + int(mm)

def distancias(mapa, origen):
    dist = {origen: 0}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        for vecina in mapa[sala]:
            if vecina not in dist:
                dist[vecina] = dist[sala] + 1
                cola.append(vecina)
    return dist

def investigar(log):
    nombres, sala_de, despues, mapa = {}, {}, {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA":
            a, b = partes[3], partes[5]
            mapa.setdefault(a, set()).add(b)
            mapa.setdefault(b, set()).add(a)
            if partes[2] in nombres and partes[-1] != "DENEGADO":
                sala_de[partes[2]] = b
        elif tipo == "ERROR":
            apagado = minutos(partes[0])
            antes = dict(sala_de)
        elif tipo == "ALERTA":
            crimen, sala = minutos(partes[0]), partes[3]
        elif tipo == "INFO":
            restaurado = minutos(partes[0])
        elif tipo == "RECUENTO":
            despues[partes[2]] = partes[3]
    dist = distancias(mapa, sala)
    for tarjeta, nombre in nombres.items():
        if 2 * dist[antes[tarjeta]] <= crimen - apagado and 2 * dist[despues[tarjeta]] <= restaurado - crimen:
            return nombre
`;
const APAGON_ESTRICTO = APAGON.replace('<= crimen - apagado', '< crimen - apagado').replace('<= restaurado - crimen', '< restaurado - crimen');

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const reactor = await buscar(2, '🔍 Sabotaje en el reactor');
const apagon = await buscar(3, '🔍 El apagón');

test('los dos impostores existen con formato «impostor» en su nivel', () => {
  for (const t of [reactor, apagon]) {
    assert.ok(t, 'reto no encontrado');
    assert.equal(t.tipo, 'reto');
    assert.equal(t.formato, 'impostor');
  }
});

test('el expediente trae el registro entero; el plano solo en el reactor', async () => {
  const r = (await gql(INFO, { id: reactor.id }, T)).data.tarea.mision;
  assert.equal(r.funcion, 'investigar');
  assert.equal(r.escenarios.length, 2);
  assert.equal(r.ocultos, 6);
  const material = JSON.parse(r.material);
  assert.equal(material.length, 2);
  const m = material[0].material;
  assert.ok(m.lineas > 800 && m.log.split('\n').length === m.lineas);
  assert.match(m.log, /ALERTA SABOTAJE \w+/);
  assert.ok(m.pasillos.length >= 6);
  assert.ok(!/culpable|semilla|trampas/.test(r.material));

  const a = (await gql(INFO, { id: apagon.id }, T)).data.tarea.mision;
  const ma = JSON.parse(a.material)[0].material;
  assert.match(ma.log, /ERROR registro de puertas desactivado/);
  assert.equal(ma.pasillos, undefined);
  assert.equal(ma.salas, undefined);
});

test('I1: leer el registro con diccionarios resuelve los 8 casos', async () => {
  const e = (await gql(ENVIAR, { id: reactor.id, c: REACTOR, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 8);
  assert.equal(e.mision.estrellas, 3);
});

test('I1: olvidar el DENEGADO cae en las trampas de los ocultos', async () => {
  const e = (await gql(ENVIAR, { id: reactor.id, c: REACTOR_SIN_DENEGADO, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, false);
  assert.ok(e.mision.escenarios.some((x) => x.oculto && !x.exito));
});

test('I1: el código base no acusa a nadie; acusar a un inocente explica dónde estaba', async () => {
  const t = (await gql(INFO, { id: reactor.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: reactor.id, c: t.codigoBase, e: 1 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /«nadie» no es nadie de la tripulación/);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.equal(final.tripulantes.length, 6);
  assert.ok(final.culpable);
  assert.ok(JSON.parse(e.escena).pasillos.length >= 6);

  const inocente = final.tripulantes.find((x) => x.nombre !== final.culpable);
  const mal = (await gql(PROBAR, { id: reactor.id, c: `def investigar(log):\n    return "${inocente.nombre}"\n`, e: 1 }, T))
    .data.probarMision.escenarios[0];
  assert.equal(mal.exito, false);
  assert.match(mal.motivo, new RegExp(`${inocente.nombre} estaba en el ${inocente.sala} en la alerta \\(línea [\\d.]+\\)`));
});

test('I2: el grafo con BFS resuelve los 8 apagones; con «<» en vez de «<=» falla', async () => {
  const e = (await gql(ENVIAR, { id: apagon.id, c: APAGON, t: 90 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 8);
  assert.equal(e.puntos > 0, true);
  const mal = (await gql(ENVIAR, { id: apagon.id, c: APAGON_ESTRICTO, t: 90 }, T)).data.enviarSolucion;
  assert.equal(mal.correcto, false);
});

test('I2: el visor recibe las rutas de cada tripulante y el grafo deducido', async () => {
  const p = (await gql(PROBAR, { id: apagon.id, c: APAGON, e: 1 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, true, e.motivo);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.deepEqual(final.tripulantes.filter((x) => x.pudo).map((x) => x.nombre), [final.culpable]);
  assert.ok(final.tripulantes.every((x) => x.ruta_ida.at(-1) === final.sala));
  assert.ok(JSON.parse(e.escena).pasillos.some((x) => x.solo_denegado));
});
