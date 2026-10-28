// Fase 5.1: 💣 Bomba de cables (B1) y Bomba de módulos (B2)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto yaCompletada puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ tipo formato codigoBase mision { formato funcion escenarios ocultos material } } }`;

const CABLES = `def primer_corte(cables, serie):
    if "rojo" not in cables:
        return 1
    if cables[-1] == "blanco":
        return len(cables) - 1
    if cables.count("azul") > 1:
        return len(cables) - 1 - cables[::-1].index("azul")
    if int(serie[-1]) % 2 == 1:
        return len(cables) - 1
    return 0

def cortes_cables(cables, serie):
    primero = primer_corte(cables, serie)
    cortes = [primero]
    color = cables[primero]
    if color == "azul":
        if primero + 1 < len(cables):
            cortes.append(primero + 1)
    elif color != "rojo" and any(v in serie for v in "AEIOU"):
        sin_cortar = [i for i in range(len(cables)) if i != primero]
        cortes.append(sin_cortar[-1])
    return cortes
`;

const B1 = `${CABLES}
def desactivar(bomba):
    return cortes_cables(bomba["cables"], bomba["serie"])
`;

// B2: las columnas se toman del código base del reto (como haría el alumno)
const b2 = (codigoBase) => `${codigoBase.split('\n\n\n')[0]}

${CABLES}
def modulo_boton(boton, baterias):
    if boton["color"] == "azul" and boton["texto"] == "ABORTAR":
        return "mantener"
    if baterias > 1 and boton["texto"] == "DETONAR":
        return "pulsar"
    if boton["color"] == "blanco":
        return "mantener"
    return "pulsar"

def modulo_teclado(simbolos):
    for columna in COLUMNAS:
        if all(s in columna for s in simbolos):
            return sorted(simbolos, key=columna.index)

def desactivar(bomba):
    return {"cables": cortes_cables(bomba["cables"], bomba["serie"]),
            "boton": modulo_boton(bomba["boton"], bomba["baterias"]),
            "teclado": modulo_teclado(bomba["teclado"])}
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const cables = await buscar(1, '💣 Bomba de cables');
const modulos = await buscar(2, '💣 Bomba de módulos');

test('las dos bombas existen como retos de formato «bomba» en su nivel', () => {
  for (const r of [cables, modulos]) {
    assert.ok(r, 'bomba no encontrada');
    assert.equal(r.tipo, 'reto');
    assert.equal(r.formato, 'bomba');
  }
});

test('el manual trae las bombas visibles, sin soluciones ni datos de las ocultas', async () => {
  const t = (await gql(INFO, { id: cables.id }, T)).data.tarea;
  assert.equal(t.mision.funcion, 'desactivar');
  assert.equal(t.mision.escenarios.length, 3);
  assert.equal(t.mision.ocultos, 7);
  const material = JSON.parse(t.mision.material);
  assert.equal(material.length, 3);
  for (const { material: m } of material) {
    assert.deepEqual(Object.keys(m).sort(), ['bomba', 'variante']);
    assert.deepEqual(Object.keys(m.bomba).sort(), ['cables', 'serie']);
  }
  assert.ok(!/esperado|explicacion|objetivo|semilla/.test(t.mision.material));
});

test('B2: las columnas del manual coinciden con las del código base', async () => {
  const t = (await gql(INFO, { id: modulos.id }, T)).data.tarea;
  const material = JSON.parse(t.mision.material);
  for (const columna of material[0].material.columnas) {
    assert.ok(t.codigoBase.includes(columna.map((s) => `"${s}"`).join(', ')), `columna ${columna.join(' ')}`);
  }
});

test('B1: un corte equivocado explota y explica el manual en el escenario visible', async () => {
  const p = (await gql(PROBAR, { id: cables.id, c: 'def desactivar(bomba):\n    return [0]\n', e: 0 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /BOOM/);
  assert.match(e.motivo, /regla 3/);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.deepEqual(final.respuesta, [0]);
  assert.equal(final.correcto, false);
});

test('B1: sin el paso 2 aprueba alguna pero no todas; los ocultos no cuentan por qué', async () => {
  const soloPaso1 = B1.replace('    return cortes_cables(bomba["cables"], bomba["serie"])',
    '    return [primer_corte(bomba["cables"], bomba["serie"])]');
  const e = (await gql(ENVIAR, { id: cables.id, c: soloPaso1, t: 5 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, false);
  assert.ok(e.mision.superados > 0 && e.mision.superados < 10);
  for (const o of e.mision.escenarios.filter((x) => x.oculto && !x.exito)) {
    assert.equal(o.motivo, 'La misión falló en este escenario oculto');
    assert.equal(o.fotogramas, null);
  }
});

test('B1: la solución del manual desactiva las 10 bombas (⭐⭐⭐)', async () => {
  const e = (await gql(ENVIAR, { id: cables.id, c: B1, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 10);
  assert.equal(e.puntos, 150 + Math.round((150 * 2) / 4));
});

test('B2: la solución por módulos desactiva las 10 bombas', async () => {
  const t = (await gql(INFO, { id: modulos.id }, T)).data.tarea;
  const e = (await gql(ENVIAR, { id: modulos.id, c: b2(t.codigoBase), t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje + JSON.stringify(e.mision.escenarios.map((x) => x.motivo)));
  assert.equal(e.mision.superados, 10);
});

test('B2: el código base compila y responde, pero no desactiva', async () => {
  const t = (await gql(INFO, { id: modulos.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: modulos.id, c: t.codigoBase, e: 0 }, T)).data.probarMision;
  assert.equal(p.escenarios[0].exito, false);
  assert.match(p.escenarios[0].motivo, /BOOM/);
});
