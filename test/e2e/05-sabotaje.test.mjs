// Fase 1: misiones de sabotaje
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno, admin, enviar, ENVIAR_SOLUCION, tareaSinTests } from './helpers.mjs';

const SOLUCION_PARENTESIS = `def es_valido(cadena):
    pila = []
    pares = {")": "(", "]": "[", "}": "{"}
    for c in cadena:
        if c in pares:
            if not pila or pila.pop() != pares[c]:
                return False
        else:
            pila.append(c)
    return not pila`;

const CAMPOS = 'id tareaOriginalId tareaId operador descripcion linea lineasCambiadas diff codigo contexto dificultad testsFallidos testsTotales origen';
const GENERAR = `mutation($id:ID!,$n:Int,$ia:Boolean){ generarSabotajes(tareaId:$id, cantidad:$n, usarIa:$ia){ ${CAMPOS} } }`;
const PUBLICAR = `mutation($id:ID!,$c:String){ publicarSabotaje(id:$id, contexto:$c){ id tipo titulo contexto codigoBase } }`;
const SALA = `{ salaDeMaquinas { bloqueados disponibles { tareaId titulo contexto dificultad completada tareaOriginalTitulo } } }`;
const ENVIAR_CON_REVELACION = ENVIAR_SOLUCION.replace('correcto yaCompletada', 'correcto yaCompletada insigniasNuevas revelacion { operador descripcion linea diff }');

const ADMIN = await admin();
const A = ADMIN.token;

// Las 3 copias del reto «Validar Paréntesis» (una para cada bloque de pruebas)
const copias = (await gql(`{ tareasPorCategoria(categoriaId: 16){ id titulo } }`, {}, A)).data.tareasPorCategoria
  .filter((t) => t.titulo === 'Validar Paréntesis').map((t) => t.id);

// Deshace un sabotaje de una sola línea a partir de su diff (lo que haría un alumno «cirujano»)
const arreglar = (s) => {
  const lineas = s.diff.split('\n');
  const antes = lineas.find((l) => l.startsWith('-') && !l.startsWith('---')).slice(1);
  const despues = lineas.find((l) => l.startsWith('+') && !l.startsWith('+++')).slice(1);
  return s.codigo.replace(despues, antes);
};

test('hay al menos 3 copias del reto para probar', () => {
  assert.ok(copias.length >= 3, `copias: ${copias}`);
});

test('tareasSaboteables: solo admin; incluye los retos con solución y tests', async () => {
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql('{ tareasSaboteables { id } }', {}, alumno.token)), 'FORBIDDEN');
  const r = await gql('{ tareasSaboteables { id titulo tests } }', {}, A);
  const ids = r.data.tareasSaboteables.map((t) => t.id);
  for (const id of copias) assert.ok(ids.includes(id));
  // Fase 7: los ejercicios de los planetas ya tienen solución y tests, así que también se pueden sabotear
  assert.ok(ids.includes('1'), 'la tarea 1 tiene solución y tests desde la fase 7');
  assert.ok(!ids.includes(await tareaSinTests()), 'una tarea sin solución ni tests no se puede sabotear');
});

test('generar: solo admin y la tarea necesita solución y tests', async () => {
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(GENERAR, { id: copias[0], n: 3 }, alumno.token)), 'FORBIDDEN');
  const r = await gql(GENERAR, { id: await tareaSinTests(), n: 3 }, A);
  assert.equal(codigoError(r), 'BAD_USER_INPUT');
});

test('sabotaje con IA: verificado igual que los del mutador', async () => {
  const r = await gql(GENERAR, { id: copias[2], n: 3, ia: true }, A);
  const lista = r.data?.generarSabotajes;
  assert.ok(lista, r.errors?.[0]?.message);
  const ia = lista.find((s) => s.origen === 'ia');
  assert.ok(ia, 'debería incluir el sabotaje de la IA');
  assert.equal(ia.contexto, 'La IA de a bordo sospecha de una condición.');
  assert.ok(ia.testsFallidos >= 1);
  // El cambio lo aplica la API: una sola línea, en su sitio y con la sangría original
  assert.equal(ia.lineasCambiadas, 1);
  const lineas = ia.codigo.split('\n');
  assert.equal(lineas[ia.linea - 1], '    return pila');
  assert.match(ia.diff, /^- {5}return not pila\n\+ {5}return pila$/);
});

let sabotajes;

test('generar: 3-5 sabotajes verificados (se ejecutan y fallan algún test)', async () => {
  const r = await gql(GENERAR, { id: copias[0], n: 5 }, A);
  sabotajes = r.data?.generarSabotajes;
  assert.ok(sabotajes, r.errors?.[0]?.message);
  assert.ok(sabotajes.length >= 3 && sabotajes.length <= 5, `generados: ${sabotajes.length}`);
  for (const s of sabotajes) {
    assert.equal(s.tareaId, null, 'aún sin publicar');
    assert.equal(s.origen, 'ast');
    assert.ok(['facil', 'media', 'dificil'].includes(s.dificultad));
    assert.ok(s.testsFallidos >= 1 && s.testsFallidos <= s.testsTotales);
    if (s.testsFallidos === s.testsTotales) assert.equal(s.dificultad, 'facil');
    assert.ok(s.lineasCambiadas >= 1 && s.lineasCambiadas <= 3);
    assert.ok(s.diff.includes('-') && s.diff.includes('+'));
    assert.ok(s.contexto && s.contexto.length > 10);
  }
  assert.ok(new Set(sabotajes.map((s) => s.operador)).size >= 2, 'operadores variados');
});

test('comprobación independiente: ningún sabotaje pasa la corrección de la tarea original', async () => {
  const alumno = await nuevoAlumno();
  for (const s of sabotajes) {
    const r = await enviar(alumno.token, copias[0], s.codigo);
    assert.equal(r.correcto, false, `${s.descripcion} no debería ser correcto`);
    assert.equal(r.ejecucion.status.id, 3, `${s.descripcion} debería ejecutarse sin error`);
  }
});

test('generar otra vez no repite sabotajes (aunque se agoten las variantes)', async () => {
  // Este reto es corto: el mutador solo saca unas pocas variantes válidas y la primera llamada ya las gastó
  const r = await gql(GENERAR, { id: copias[0], n: 10 }, A);
  assert.ok(Array.isArray(r.data?.generarSabotajes), r.errors?.[0]?.message);
  const nuevos = r.data.generarSabotajes.map((s) => s.codigo);
  const anteriores = new Set(sabotajes.map((s) => s.codigo));
  assert.ok(nuevos.every((c) => !anteriores.has(c)), 'ningún sabotaje nuevo repite uno anterior');

  const guardados = (await gql(`query($id:ID!){ sabotajesDeTarea(tareaId:$id){ codigo } }`, { id: copias[0] }, A)).data.sabotajesDeTarea;
  const codigos = guardados.map((s) => s.codigo);
  assert.equal(new Set(codigos).size, codigos.length, 'sin duplicados en la base de datos');
  assert.equal(codigos.length, sabotajes.length + nuevos.length);
});

test('el número faltante (más aritmética) admite varios sabotajes', async () => {
  const arbol = (await gql(`{ tareasPorCategoria(categoriaId: 16){ id titulo } }`, {}, A)).data.tareasPorCategoria
    .find((t) => t.titulo === 'Encontrar el Número Faltante');
  const r = await gql(GENERAR, { id: arbol.id, n: 5 }, A);
  const lista = r.data?.generarSabotajes;
  assert.ok(lista?.length >= 3, `${lista?.length} sabotajes · ${r.errors?.[0]?.message || ''}`);
});

let publicado;
let elegido;

test('publicar: crea una tarea tipo sabotaje con el código roto; no se publica dos veces', async () => {
  elegido = sabotajes.find((s) => s.lineasCambiadas === 1);
  assert.ok(elegido, 'hace falta un sabotaje de una línea');
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(PUBLICAR, { id: elegido.id }, alumno.token)), 'FORBIDDEN');

  const r = await gql(PUBLICAR, { id: elegido.id, c: 'Alerta: los escudos fallan.' }, A);
  publicado = r.data?.publicarSabotaje;
  assert.ok(publicado, r.errors?.[0]?.message);
  assert.equal(publicado.tipo, 'sabotaje');
  assert.equal(publicado.contexto, 'Alerta: los escudos fallan.');
  assert.equal(publicado.codigoBase, elegido.codigo);
  assert.match(publicado.titulo, /^🕵️ Sabotaje: Validar Paréntesis/);

  assert.equal(codigoError(await gql(PUBLICAR, { id: elegido.id }, A)), 'BAD_USER_INPUT');
});

test('los sabotajes no salen en los listados ni en el reto diario', async () => {
  const alumno = await nuevoAlumno();
  for (const q of ['{ tareas { id tipo } }', '{ tareasPorCategoria(categoriaId: 16){ id tipo } }', '{ tareasPorNivel(nivelId: 4){ id tipo } }', '{ tareasPendientes { id tipo } }']) {
    const r = await gql(q, {}, alumno.token);
    const lista = Object.values(r.data)[0];
    assert.ok(!lista.some((t) => t.tipo === 'sabotaje'), q);
  }
  const d = await gql('{ dailyChallenge { tipo } }', {}, alumno.token);
  assert.equal(d.data.dailyChallenge.tipo, 'codigo');
});

test('bloqueado hasta completar la tarea original', async () => {
  const alumno = await nuevoAlumno();
  const T = alumno.token;
  assert.equal(codigoError(await gql(`query($id:ID!){ tarea(id:$id){ id } }`, { id: publicado.id }, T)), 'FORBIDDEN');
  assert.equal(codigoError(await gql(ENVIAR_SOLUCION, { id: publicado.id, c: 'print(1)', t: 1 }, T)), 'FORBIDDEN');
  assert.equal(codigoError(await gql(`mutation($id:ID!){ pedirPista(tareaId:$id, codigo:"x"){ pista } }`, { id: publicado.id }, T)), 'FORBIDDEN');
  const sala = (await gql(SALA, {}, T)).data.salaDeMaquinas;
  assert.ok(sala.bloqueados >= 1);
  assert.ok(!sala.disponibles.some((d) => d.tareaId === publicado.id));
});

test('flujo completo: desbloquear, fallar, pista, arreglar como cirujano y ver la revelación', async () => {
  const alumno = await nuevoAlumno();
  const T = alumno.token;

  assert.equal((await enviar(T, copias[0], SOLUCION_PARENTESIS)).correcto, true);

  let sala = (await gql(SALA, {}, T)).data.salaDeMaquinas;
  const disponible = sala.disponibles.find((d) => d.tareaId === publicado.id);
  assert.ok(disponible, 'desbloqueado al completar la original');
  assert.equal(disponible.completada, false);
  assert.equal(disponible.tareaOriginalTitulo, 'Validar Paréntesis');

  const t = (await gql(`query($id:ID!){ tarea(id:$id){ tipo contexto codigoBase } }`, { id: publicado.id }, T)).data.tarea;
  assert.equal(t.codigoBase, elegido.codigo);

  // Enviar el código saboteado tal cual: falla y no revela nada
  let r = (await gql(ENVIAR_CON_REVELACION, { id: publicado.id, c: elegido.codigo, t: 5 }, T)).data.enviarSolucion;
  assert.equal(r.correcto, false);
  assert.equal(r.revelacion, null);

  // Pistas: en los niveles 1-2 la IA no recibe ni la solución ni el bug; en el 3, sí
  const PISTA = `mutation($id:ID!,$c:String!,$n:Int){ pedirPista(tareaId:$id, codigo:$c, nivel:$n){ pista } }`;
  const p1 = await gql(PISTA, { id: publicado.id, c: elegido.codigo, n: 1 }, T);
  assert.match(p1.data.pedirPista.pista, /sabotaje, solucion no, confidencial no/);
  const p3 = await gql(PISTA, { id: publicado.id, c: elegido.codigo, n: 3 }, T);
  assert.match(p3.data.pedirPista.pista, /sabotaje, solucion si, confidencial si/);
  // Si en nivel 1-2 la IA dice la línea, el alumno recibe una pista genérica segura
  const fuga = await gql(PISTA, { id: publicado.id, c: `${elegido.codigo}\n# FUGA_SABOTAJE`, n: 2 }, T);
  assert.doesNotMatch(fuga.data.pedirPista.pista, /línea 5/);
  assert.match(fuga.data.pedirPista.pista, /Céntrate en las decisiones/);
  // En nivel 3 decir la línea sí está permitido
  const fuga3 = await gql(PISTA, { id: publicado.id, c: `${elegido.codigo}\n# FUGA_SABOTAJE`, n: 3 }, T);
  assert.match(fuga3.data.pedirPista.pista, /línea 5/);

  // Arreglo de una línea: correcto, puntos, revelación e insignia Cirujano
  r = (await gql(ENVIAR_CON_REVELACION, { id: publicado.id, c: arreglar(elegido), t: 60 }, T)).data.enviarSolucion;
  assert.equal(r.correcto, true, r.mensaje);
  assert.ok(r.puntos > 0);
  assert.deepEqual(r.insigniasNuevas, ['Cirujano']);
  assert.equal(r.revelacion.diff, elegido.diff);
  assert.equal(r.revelacion.linea, elegido.linea);

  // Otra vez: sin puntos ni insignia, pero se sigue viendo la revelación
  r = (await gql(ENVIAR_CON_REVELACION, { id: publicado.id, c: arreglar(elegido), t: 61 }, T)).data.enviarSolucion;
  assert.equal(r.yaCompletada, true);
  assert.equal(r.puntos, 0);
  assert.deepEqual(r.insigniasNuevas, []);
  assert.ok(r.revelacion);

  sala = (await gql(SALA, {}, T)).data.salaDeMaquinas;
  assert.equal(sala.disponibles.find((d) => d.tareaId === publicado.id).completada, true);
});

test('arreglar con cambios de más: correcto pero sin insignia Cirujano', async () => {
  const alumno = await nuevoAlumno();
  const T = alumno.token;
  await enviar(T, copias[0], SOLUCION_PARENTESIS);
  const conExtras = `${arreglar(elegido)}\n# lo he arreglado\nprint("revisado")`;
  const r = (await gql(ENVIAR_CON_REVELACION, { id: publicado.id, c: conExtras, t: 30 }, T)).data.enviarSolucion;
  assert.equal(r.correcto, true, r.mensaje);
  assert.deepEqual(r.insigniasNuevas, []);
});

test('descartar: los no publicados sí, los publicados no', async () => {
  const pendiente = sabotajes.find((s) => s.id !== elegido.id);
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(`mutation($id:ID!){ descartarSabotaje(id:$id) }`, { id: pendiente.id }, alumno.token)), 'FORBIDDEN');
  assert.equal((await gql(`mutation($id:ID!){ descartarSabotaje(id:$id) }`, { id: pendiente.id }, A)).data.descartarSabotaje, true);
  assert.equal(codigoError(await gql(`mutation($id:ID!){ descartarSabotaje(id:$id) }`, { id: elegido.id }, A)), 'BAD_USER_INPUT');
  const lista = (await gql(`query($id:ID!){ sabotajesDeTarea(tareaId:$id){ id tareaId } }`, { id: copias[0] }, A)).data.sabotajesDeTarea;
  assert.ok(!lista.some((s) => s.id === pendiente.id));
  assert.equal(lista.find((s) => s.id === elegido.id).tareaId, publicado.id);
});
