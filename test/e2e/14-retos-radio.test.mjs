// Fase 5.6: 🎵 La señal de radio (transmitir en morse y descifrar una señal con ruido)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno } from './helpers.mjs';

const RESULTADO = `estrellas superados total escenarios { nombre oculto exito motivo metricas fotogramas escena registro { t texto } }`;
const PROBAR = `mutation($id:ID!,$c:String!,$e:Int){ probarMision(tareaId:$id, codigo:$c, escenario:$e){ ${RESULTADO} } }`;
const ENVIAR = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto puntos mensaje mision { ${RESULTADO} } } }`;
const INFO = `query($id:ID!){ tarea(id:$id){ codigoBase mision { formato funcion escenarios ocultos material } } }`;

const SOS = `def transmitir(senal):
    salida = []
    for _ in range(senal["repeticiones"]):
        for i, pulsos in enumerate([1, 1, 1, 3, 3, 3, 1, 1, 1]):
            if i > 0:
                salida.append(("silencio", 1))
            salida.append((senal["nota"], pulsos))
        salida.append(("silencio", 4))
    return salida
`;

const alumno = await nuevoAlumno();
const T = alumno.token;

const buscar = async (nivel, titulo) =>
  (await gql(`query($n:ID!){ tareasPorNivel(nivelId:$n){ id titulo tipo formato } }`, { n: String(nivel) }, T)).data.tareasPorNivel
    .find((t) => t.titulo === titulo);

const sos = await buscar(1, '🎵 SOS');
const transmisor = await buscar(2, '🎵 El transmisor morse');
const ruido = await buscar(3, '🎵 La señal con ruido');

// El código base de R2 y R3 trae MORSE y ESCALA: la solución completa se monta sobre él
const cabecera = (codigoBase) => codigoBase.slice(0, codigoBase.indexOf('\n\n\ndef '));

test('las tres radios existen con formato «radio» en su nivel', () => {
  for (const t of [sos, transmisor, ruido]) {
    assert.ok(t, 'reto no encontrado');
    assert.equal(t.tipo, 'reto');
    assert.equal(t.formato, 'radio');
  }
});

test('la función depende del reto: transmitir() en R1 y R2, recibir() en R3', async () => {
  assert.equal((await gql(INFO, { id: sos.id }, T)).data.tarea.mision.funcion, 'transmitir');
  assert.equal((await gql(INFO, { id: transmisor.id }, T)).data.tarea.mision.funcion, 'transmitir');
  const r3 = (await gql(INFO, { id: ruido.id }, T)).data.tarea.mision;
  assert.equal(r3.funcion, 'recibir');
  // En R3 el material es la señal dañada; nunca el texto
  const material = JSON.parse(r3.material);
  assert.deepEqual(Object.keys(material[1].material).sort(), ['senal', 'variante']);
  assert.ok(!r3.material.includes('TIERRA'));
});

test('R1: la baliza SOS en los 6 escenarios', async () => {
  const e = (await gql(ENVIAR, { id: sos.id, c: SOS, t: 30 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 6);
  assert.equal(e.mision.estrellas, 3);
});

test('R1: el código base dice dónde está la primera diferencia', async () => {
  const t = (await gql(INFO, { id: sos.id }, T)).data.tarea;
  const p = (await gql(PROBAR, { id: sos.id, c: t.codigoBase, e: 0 }, T)).data.probarMision;
  const e = p.escenarios[0];
  assert.equal(e.exito, false);
  assert.match(e.motivo, /faltan \d+ elementos/);
  const final = JSON.parse(e.fotogramas).at(-1);
  assert.equal(final.diferencia, 2);
  assert.equal(final.objetivo.length, 54);
});

test('R2: el transmisor completo supera los 7 mensajes', async () => {
  const t = (await gql(INFO, { id: transmisor.id }, T)).data.tarea;
  const codigo = `${cabecera(t.codigoBase)}

def transmitir(senal):
    palabras = []
    for palabra in senal["mensaje"].upper().split():
        limpia = [c for c in palabra if c in MORSE]
        if limpia:
            palabras.append(limpia)
    inicio = ESCALA.index(senal["nota"])
    salida = []
    for i, palabra in enumerate(palabras):
        nota = ESCALA[(inicio + i) % len(ESCALA)]
        if i > 0:
            salida.append(("silencio", 7))
        for j, letra in enumerate(palabra):
            if j > 0:
                salida.append(("silencio", 3))
            for k, simbolo in enumerate(MORSE[letra]):
                if k > 0:
                    salida.append(("silencio", 1))
                salida.append((nota, 1 if simbolo == "." else 3))
    return salida
`;
  const e = (await gql(ENVIAR, { id: transmisor.id, c: codigo, t: 60 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje + JSON.stringify(e.mision.escenarios.map((x) => x.motivo)));
  assert.equal(e.mision.superados, 7);
});

test('R3: descifrar con umbrales supera las 8 señales; si falla, enseña el mensaje del visible', async () => {
  const t = (await gql(INFO, { id: ruido.id }, T)).data.tarea;
  const codigo = `${cabecera(t.codigoBase)}

INVERSO = {codigo: letra for letra, codigo in MORSE.items()}

def recibir(senal):
    limpia = []
    for tipo, d in senal:
        if tipo == "estatica":
            continue
        if limpia and tipo == "silencio" and limpia[-1][0] == "silencio":
            limpia[-1] = ("silencio", limpia[-1][1] + d)
        else:
            limpia.append((tipo, d))
    texto, letra = "", ""
    for tipo, d in limpia:
        if tipo != "silencio":
            letra += "." if d <= 2 else "-"
        elif d >= 3:
            texto += INVERSO.get(letra, "?") if letra else ""
            letra = ""
            if d >= 6:
                texto += " "
    texto += INVERSO.get(letra, "") if letra else ""
    return texto.strip()
`;
  const e = (await gql(ENVIAR, { id: ruido.id, c: codigo, t: 90 }, T)).data.enviarSolucion;
  assert.equal(e.correcto, true, e.mensaje);
  assert.equal(e.mision.superados, 8);

  const p = (await gql(PROBAR, { id: ruido.id, c: t.codigoBase, e: 1 }, T)).data.probarMision;
  assert.equal(p.escenarios[0].exito, false);
  assert.equal(JSON.parse(p.escenarios[0].fotogramas).at(-1).esperado, 'HOLA TIERRA');
});
