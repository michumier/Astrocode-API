// Lecciones (fase 12): la pregunta no revela la respuesta, los puntos se dan una vez y la ruta las respeta.
// Va contra astrocode-api-ruta (con candados), como 16-ruta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoError, unico } from './helpers.mjs';

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
  const nombre = unico('leccion');
  const email = `${nombre}@example.test`;
  const contrasena = `Prueba-${Math.random().toString(36).slice(2)}`;
  await gql('mutation($i:CrearUsuarioInput!){ crearUsuario(input:$i){ id } }',
    { i: { nombre_usuario: nombre, correo_electronico: email, contrasena } });
  const r = await gql('mutation($i:LoginInput!){ login(input:$i){ token } }', { i: { correo_electronico: email, contrasena } });
  return r.data.login.token;
}

const LECCION = `query($id:ID!){ leccion(id:$id){ id titulo planeta completada
  bloques { tipo texto codigo pista } pregunta { codigo opciones } siguiente { tipo id titulo } } }`;
const RESPONDER = `mutation($id:ID!,$o:Int!){ responderLeccion(leccionId:$id, opcion:$o){ correcta explicacion puntos yaCompletada } }`;
const puntos = async (token) => (await gql('{ me { puntos } }', {}, token)).data.me.puntos;
const leccionesDeMercurio = async (token) =>
  (await gql('{ ruta { pasos { tipo leccion { id titulo } } } }', {}, token)).data.ruta[0].pasos.filter((s) => s.tipo === 'leccion').map((s) => s.leccion);

// Índice de la opción correcta sin saberlo de antemano: la que da correcta = true (con otro alumno)
async function opcionCorrecta(id) {
  const token = await alumno();
  for (let o = 0; o < 3; o++) {
    if ((await gql(RESPONDER, { id, o }, token)).data.responderLeccion.correcta) return o;
  }
  throw new Error('sin opción correcta');
}

test('la lección trae su contenido y su pregunta, pero nunca dice cuál es la respuesta buena', async () => {
  const token = await alumno();
  const [primera] = await leccionesDeMercurio(token);
  const { data } = await gql(LECCION, { id: primera.id }, token);
  const l = data.leccion;
  assert.equal(l.titulo, 'Tu primer programa: print y comentarios');
  assert.equal(l.planeta, 'Mercurio');
  assert.equal(l.completada, false);
  assert.deepEqual(l.bloques.map((b) => b.tipo), ['texto', 'codigo', 'texto', 'error']);
  assert.ok(l.bloques[1].pista);
  assert.equal(l.pregunta.opciones.length, 3);
  assert.equal(l.siguiente.tipo, 'leccion');
  assert.equal(l.siguiente.titulo, 'Variables: cajas con nombre');
  // En la respuesta no hay nada que delate la correcta
  assert.doesNotMatch(JSON.stringify(data), /correcta|explicacion/);
});

test('acertar a la primera da 15 puntos; volver a responder ya no suma', async () => {
  const token = await alumno();
  const [primera] = await leccionesDeMercurio(token);
  const buena = await opcionCorrecta(primera.id);
  const antes = await puntos(token);

  const r = (await gql(RESPONDER, { id: primera.id, o: buena }, token)).data.responderLeccion;
  assert.deepEqual([r.correcta, r.puntos, r.yaCompletada], [true, 15, false]);
  assert.ok(r.explicacion.length > 10);
  assert.equal(await puntos(token), antes + 15);

  const otra = (await gql(RESPONDER, { id: primera.id, o: buena }, token)).data.responderLeccion;
  assert.deepEqual([otra.correcta, otra.puntos, otra.yaCompletada], [true, 0, true]);
  assert.equal(await puntos(token), antes + 15);
  assert.equal((await gql(LECCION, { id: primera.id }, token)).data.leccion.completada, true);
});

test('fallar primero explica por qué, no completa la lección y deja solo los 10 puntos', async () => {
  const token = await alumno();
  const [primera] = await leccionesDeMercurio(token);
  const buena = await opcionCorrecta(primera.id);
  const mala = (buena + 1) % 3;
  const antes = await puntos(token);

  const fallo = (await gql(RESPONDER, { id: primera.id, o: mala }, token)).data.responderLeccion;
  assert.deepEqual([fallo.correcta, fallo.puntos], [false, 0]);
  assert.ok(fallo.explicacion.length > 10);
  assert.equal((await gql(LECCION, { id: primera.id }, token)).data.leccion.completada, false);

  const acierto = (await gql(RESPONDER, { id: primera.id, o: buena }, token)).data.responderLeccion;
  assert.deepEqual([acierto.correcta, acierto.puntos], [true, 10]);
  assert.equal(await puntos(token), antes + 10);
});

test('las lecciones respetan el orden: la segunda está cerrada hasta completar la primera', async () => {
  const token = await alumno();
  const [primera, segunda] = await leccionesDeMercurio(token);
  const cerrada = await gql(LECCION, { id: segunda.id }, token);
  assert.equal(codigoError(cerrada), 'FORBIDDEN');
  assert.match(cerrada.errors[0].message, /pasos anteriores de Mercurio/);
  assert.equal(codigoError(await gql(RESPONDER, { id: segunda.id, o: 0 }, token)), 'FORBIDDEN');

  await gql(RESPONDER, { id: primera.id, o: await opcionCorrecta(primera.id) }, token);
  assert.equal((await gql(LECCION, { id: segunda.id }, token)).errors, undefined);
});

test('una opción que no existe se rechaza, y sin sesión no se puede responder', async () => {
  const token = await alumno();
  const [primera] = await leccionesDeMercurio(token);
  assert.equal(codigoError(await gql(RESPONDER, { id: primera.id, o: 7 }, token)), 'BAD_USER_INPUT');
  assert.equal(codigoError(await gql(RESPONDER, { id: primera.id, o: 0 })), 'UNAUTHENTICATED');
});
