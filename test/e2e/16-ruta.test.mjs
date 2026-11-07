// Ruta de aprendizaje (fase 11): candados, apertura de planetas y bonus de conquista.
// Va contra astrocode-api-ruta, la misma API y la misma BD pero con los candados puestos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoError, unico, admin } from './helpers.mjs';

const URL = process.env.API_RUTA_URL || 'http://localhost:4101/graphql';

async function gql(query, variables = {}, token) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function alumno() {
  const nombre = unico('ruta');
  const email = `${nombre}@example.test`;
  const contrasena = `Prueba-${Math.random().toString(36).slice(2)}`;
  await gql('mutation($i:CrearUsuarioInput!){ crearUsuario(input:$i){ id } }',
    { i: { nombre_usuario: nombre, correo_electronico: email, contrasena } });
  const r = await gql('mutation($i:LoginInput!){ login(input:$i){ token } }', { i: { correo_electronico: email, contrasena } });
  return r.data.login.token;
}

const RUTA = `{ ruta { clave estado hechos total bonus pasos { orden estado tarea { id } } } }`;
const ENVIAR = `mutation($id:ID!,$c:String!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:30){
  correcto puntos planetaConquistado { clave nombre puntos } } }`;
const enviar = (token, id, codigo) => gql(ENVIAR, { id: String(id), c: codigo }, token);
const puntos = async (token) => (await gql('{ me { puntos } }', {}, token)).data.me.puntos;

// Soluciones de los 4 pasos de Mercurio (#1, #19, #4 y #2)
const MERCURIO = [
  [1, 'print("=== REGISTRO DE COMANDANTE ESPACIAL ===")\nedad = 25\nprint(f"Edad del comandante: {edad} años terrestres")\nprint("Comandante registrado. ¡Listo para el despegue!")\n'],
  [19, 'print("Registro de nave espacial")\nnombre = "Estrella Polar"\ntipo = "Explorador"\ntripulacion = 5\ncombustible = 750\nprint(f"Nave {nombre} ({tipo}) — Tripulación: {tripulacion} — Combustible: {combustible}")\n'],
  [4, 'print("=== CALCULADORA DE COMBUSTIBLE ===")\ncombustible_inicial = 1000\nconsumo_aceleracion = 150\nconsumo_frenado = 75\nmaniobras = 3\npor_maniobra = consumo_aceleracion + consumo_frenado\ntotal = por_maniobra * maniobras\nrestante = combustible_inicial - total\nporcentaje = restante / combustible_inicial * 100\nprint(f"Consumo por maniobra: {por_maniobra} litros")\nprint(f"Consumo total de la misión: {total} litros")\nprint(f"Combustible restante: {restante} litros")\nprint(f"Porcentaje restante: {porcentaje}%")\n'],
  [2, 'print("=== SISTEMA DE TELEMETRÍA ===")\nvelocidad = "2500"\ntemperatura = 98.6\ncoordenada_x = 42\nsistema_activo = 1\nvelocidad_num = int(velocidad)\ntemperatura_int = int(temperatura)\ncoordenada_txt = str(coordenada_x)\nactivo = bool(sistema_activo)\nprint(f"Velocidad: {velocidad_num} ({type(velocidad_num).__name__})")\nprint(f"Temperatura: {temperatura_int} ({type(temperatura_int).__name__})")\nprint(f"Coordenada X: {coordenada_txt!r} ({type(coordenada_txt).__name__})")\nprint(f"Sistema activo: {activo} ({type(activo).__name__})")\nprint(f"Distancia recorrida en 2 horas: {velocidad_num * 2} km")\n'],
];

test('la ruta: 6 planetas en orden con sus bonus; quien empieza solo tiene abierto el primer paso', async () => {
  const token = await alumno();
  const { data } = await gql(RUTA, {}, token);
  assert.deepEqual(data.ruta.map((p) => [p.clave, p.estado, p.bonus]), [
    ['mercurio', 'abierto', 100], ['venus', 'bloqueado', 150], ['tierra', 'bloqueado', 200],
    ['marte', 'bloqueado', 250], ['jupiter', 'bloqueado', 300], ['saturno', 'bloqueado', 400],
  ]);
  assert.deepEqual(data.ruta.map((p) => p.total), [4, 6, 8, 5, 10, 5]);
  assert.deepEqual(data.ruta[0].pasos.map((s) => [s.tarea.id, s.estado]),
    [['1', 'siguiente'], ['19', 'bloqueado'], ['4', 'bloqueado'], ['2', 'bloqueado']]);
});

test('no se puede saltar: ni abrir ni enviar un paso bloqueado, ni uno de un planeta cerrado', async () => {
  const token = await alumno();
  const abrir = await gql('query($id:ID!){ tarea(id:$id){ id } }', { id: '19' }, token);
  assert.equal(codigoError(abrir), 'FORBIDDEN');
  assert.match(abrir.errors[0].message, /pasos anteriores de Mercurio/);

  const saltar = await enviar(token, 19, MERCURIO[1][1]);
  assert.equal(codigoError(saltar), 'FORBIDDEN');

  const otroPlaneta = await enviar(token, 55, 'def piloto(sensores):\n    return {"empuje": 1}\n');
  assert.equal(codigoError(otroPlaneta), 'FORBIDDEN');
  assert.match(otroPlaneta.errors[0].message, /Conquista Mercurio para abrir Venus/);

  // Los retos diarios no están en la ruta: siguen libres
  const diario = await gql('query($id:ID!){ tarea(id:$id){ id } }', { id: '47' }, token);
  assert.equal(diario.errors, undefined);
});

test('paso a paso hasta conquistar Mercurio: bonus una sola vez y Venus se abre', async () => {
  const token = await alumno();
  let r;
  let deEjercicios = 0;
  for (const [i, [id, codigo]] of MERCURIO.entries()) {
    r = (await enviar(token, id, codigo)).data.enviarSolucion;
    assert.equal(r.correcto, true, `paso ${id}`);
    deEjercicios += r.puntos;
    if (i < MERCURIO.length - 1) assert.equal(r.planetaConquistado, null);
  }
  assert.deepEqual(r.planetaConquistado, { clave: 'mercurio', nombre: 'Mercurio', puntos: 100 });

  // Puntos: los de los 4 ejercicios más el bonus de Mercurio, una vez
  const total = deEjercicios + 100;
  assert.equal(await puntos(token), total);

  const { data } = await gql(RUTA, {}, token);
  assert.equal(data.ruta[0].estado, 'conquistado');
  assert.equal(data.ruta[0].hechos, 4);
  assert.equal(data.ruta[1].estado, 'abierto');
  assert.equal(data.ruta[1].pasos[0].estado, 'siguiente');

  // Repetir un paso ya hecho no vuelve a dar el bonus
  const repetido = (await enviar(token, 2, MERCURIO[3][1])).data.enviarSolucion;
  assert.equal(repetido.planetaConquistado, null);
  assert.equal(await puntos(token), total);
});

test('los admins no tienen candados', async () => {
  const { token } = await admin();
  const { data } = await gql(RUTA, {}, token);
  assert.ok(data.ruta.every((p) => p.estado !== 'bloqueado'));
  const abrir = await gql('query($id:ID!){ tarea(id:$id){ id } }', { id: '57' }, token);
  assert.equal(abrir.errors, undefined);
});
