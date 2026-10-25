import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno, admin, unico } from './helpers.mjs';

test('registro: valida usuario, email y contraseña', async () => {
  let r = await gql(`mutation{ crearUsuario(input:{nombre_usuario:"ab", correo_electronico:"x@y.es", contrasena:"12345678"}){ id } }`);
  assert.equal(codigoError(r), 'BAD_USER_INPUT', 'usuario demasiado corto');
  r = await gql(`mutation{ crearUsuario(input:{nombre_usuario:"${unico('u')}", correo_electronico:"no-es-email", contrasena:"12345678"}){ id } }`);
  assert.equal(codigoError(r), 'BAD_USER_INPUT', 'email no válido');
  r = await gql(`mutation{ crearUsuario(input:{nombre_usuario:"${unico('u')}", correo_electronico:"${unico('c')}@example.test", contrasena:"corta"}){ id } }`);
  assert.equal(codigoError(r), 'BAD_USER_INPUT', 'contraseña corta');
});

test('registro y login de un alumno', async () => {
  const alumno = await nuevoAlumno();
  assert.ok(alumno.token);
  assert.equal(alumno.usuario.rol, 'alumno');
});

test('ADMIN_EMAILS da rol admin', async () => {
  const a = await admin();
  assert.equal(a.usuario.rol, 'admin');
});

test('ranking público sin emails', async () => {
  const r = await gql(`{ ranking(limite: 5){ nombre_usuario puntos posicion } }`);
  assert.ok(Array.isArray(r.data.ranking));
  assert.equal(r.data.ranking[0].posicion, 1);
  const r2 = await gql(`{ ranking(limite: 5){ correo_electronico } }`);
  assert.ok(r2.errors, 'RankingEntry no tiene campo de email');
});

test('lista de usuarios con emails: solo admin', async () => {
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(`{ usuarios { correo_electronico } }`)), 'UNAUTHENTICATED');
  assert.equal(codigoError(await gql(`{ usuarios { correo_electronico } }`, {}, alumno.token)), 'FORBIDDEN');
  const a = await admin();
  const r = await gql(`{ usuarios { id } }`, {}, a.token);
  assert.ok(r.data.usuarios.length > 0);
});

test('no se pueden editar los puntos', async () => {
  const alumno = await nuevoAlumno();
  const r = await gql(`mutation($id:ID!){ actualizarUsuario(id:$id, input:{puntos: 999999}){ puntos } }`, { id: alumno.usuario.id }, alumno.token);
  assert.ok(r.errors);
});

test('contenido (tareas, categorías, niveles): solo admin', async () => {
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(`mutation{ crearCategoria(input:{nombre:"Hack"}){ id } }`, {}, alumno.token)), 'FORBIDDEN');
  assert.equal(codigoError(await gql(`mutation{ eliminarTarea(id: 1) }`, {}, alumno.token)), 'FORBIDDEN');
  assert.equal(codigoError(await gql(`mutation{ crearNivel(input:{nombre:"X", puntos: 1}){ id } }`, {}, alumno.token)), 'FORBIDDEN');
});

test('cambiar contraseña y borrar la propia cuenta', async () => {
  const alumno = await nuevoAlumno();
  let r = await gql(`mutation($id:ID!,$a:String!,$n:String!){ cambiarContrasena(id:$id, contrasenaActual:$a, nuevaContrasena:$n) }`,
    { id: alumno.usuario.id, a: alumno.contrasena, n: alumno.contrasena + 'x' }, alumno.token);
  assert.equal(r.data?.cambiarContrasena, true, r.errors?.[0]?.message);
  r = await gql(`mutation($id:ID!){ eliminarUsuario(id:$id) }`, { id: alumno.usuario.id }, alumno.token);
  assert.equal(r.data?.eliminarUsuario, true, r.errors?.[0]?.message);
});

test('queries públicas de catálogo responden', async () => {
  const alumno = await nuevoAlumno();
  for (const q of ['{ categorias { id } }', '{ niveles { id } }', '{ nivelesPorPuntos { id puntos } }', '{ tareas { id tipo } }']) {
    const r = await gql(q, {}, alumno.token);
    assert.ok(!r.errors, `${q} → ${r.errors?.[0]?.message}`);
  }
});
