// Fase 5.2: 👽 Lengua alienígena (El espejo, La gravedad, Los lagos)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ descripcion mision { formato funcion escenarios ocultos material } } }`;

const ESPEJO = 'def transformar(rejilla):\n    return [fila[::-1] for fila in rejilla]\n';
const GRAVEDAD = `def transformar(rejilla):
    filas, columnas = len(rejilla), len(rejilla[0])
    salida = [[0] * columnas for _ in range(filas)]
    for c in range(columnas):
        colores = [rejilla[f][c] for f in range(filas) if rejilla[f][c] != 0]
        for i, color in enumerate(colores):
            salida[filas - len(colores) + i][c] = color
    return salida
`;
const LAGOS = `def transformar(rejilla):
    filas, columnas = len(rejilla), len(rejilla[0])
    mojadas = set()
    pendientes = [(f, c) for f in range(filas) for c in range(columnas)
                  if (f in (0, filas - 1) or c in (0, columnas - 1)) and rejilla[f][c] == 0]
    while pendientes:
        f, c = pendientes.pop()
        if (f, c) in mojadas:
            continue
        mojadas.add((f, c))
        for df, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nf, nc = f + df, c + dc
            if 0 <= nf < filas and 0 <= nc < columnas and rejilla[nf][nc] == 0:
                pendientes.append((nf, nc))
    return [[1 if v == 0 and (f, c) not in mojadas else v for c, v in enumerate(fila)]
            for f, fila in enumerate(rejilla)]
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const retos = {
  espejo: { tarea: await buscar(1, '👽 El espejo'), codigo: ESPEJO },
  gravedad: { tarea: await buscar(2, '👽 La gravedad'), codigo: GRAVEDAD },
  lagos: { tarea: await buscar(3, '👽 Los lagos'), codigo: LAGOS },
};

test('los tres retos existen con formato «lengua» en su nivel', () => {
  for (const { tarea } of Object.values(retos)) {
    assert.ok(tarea, 'reto no encontrado');
    assert.equal(tarea.tipo, 'reto');
    assert.equal(tarea.formato, 'lengua');
  }
});

test('los ejemplos son las parejas entrada → respuesta de los visibles; el enunciado no cuenta la regla', async () => {
  for (const [nombre, { tarea }] of Object.entries(retos)) {
    const t = (await gql(INFO, { id: tarea.id }, T)).data.tarea;
    assert.equal(t.mision.funcion, 'transformar');
    assert.equal(t.mision.escenarios.length, 3);
    assert.equal(t.mision.ocultos, 6);
    const material = JSON.parse(t.mision.material);
    assert.equal(material.length, 3);
    for (const { material: m } of material) {
      assert.deepEqual(Object.keys(m).sort(), ['entrada', 'salida', 'variante']);
      assert.equal(m.entrada.length, m.salida.length);
    }
    assert.ok(!/semilla|trampa|diagonal|hueco/.test(t.mision.material), nombre);
    assert.ok(!/invierte|caen|encerrad/i.test(t.descripcion), `el enunciado de ${nombre} no debe decir la regla`);
  }
});

test('devolver la rejilla tal cual falla y marca las celdas distintas en el visible', async () => {
  const p = (await gql(PROBAR, { id: retos.gravedad.tarea.id, c: 'def transformar(rejilla):\n    return rejilla\n', e: 0 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /celdas? distintas?/);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.ok(final.diferencias.length > 0);
  const escena = JSON.parse(e.escena);
  assert.deepEqual(Object.keys(escena).sort(), ['entrada', 'esperado', 'variante']);
});

test('lagos con agua en diagonal falla (el ejemplo 3 lo descarta)', async () => {
  const diagonal = LAGOS.replace('((1, 0), (-1, 0), (0, 1), (0, -1))',
    '((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))');
  const e = (await gql(ENVIAR, { id: retos.lagos.tarea.id, c: diagonal, t: 5 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, false);
  assert.equal(e.mision.escenarios[2].exito, false);
});

test('las tres soluciones aprueban sus 9 rejillas con ⭐⭐⭐', async () => {
  const puntos = { espejo: 150, gravedad: 200, lagos: 300 };
  for (const [nombre, { tarea, codigo }] of Object.entries(retos)) {
    const r = await gql(ENVIAR, { id: tarea.id, c: codigo, t: 30 }, T);
    assert.ok(r.data, `${nombre}: ${JSON.stringify(r.errors)}`);
    const e = r.data.enviarSolucion;
    assert.equal(e.correcto, true, `${nombre}: ${e.mensaje}`);
    assert.equal(e.mision.superados, 9);
    assert.equal(e.puntos, puntos[nombre] + Math.round((puntos[nombre] * 2) / 4));
    for (const o of e.mision.escenarios.filter((x) => x.oculto)) assert.equal(o.escena, null);
  }
});
