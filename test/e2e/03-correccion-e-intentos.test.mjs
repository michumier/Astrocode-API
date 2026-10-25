import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno, enviar, retoPorTitulo, solucionTarea1 } from './helpers.mjs';

const SOLUCION_PARENTESIS = `def es_valido(cadena):
    pila = []
    pares = {")": "(", "]": "[", "}": "{"}
    for c in cadena:
        if c in pares:
            if not pila or pila.pop() != pares[c]:
                return False
        else:
            pila.append(c)
    return not pila
print("probando mi función")`;

const MIS_INTENTOS = `query($id:ID!){ misIntentos(tareaId:$id){ correcto testsSuperados testsTotales tipoError segundosEnTarea codigo } }`;

test('la antigua mutation completarTarea ya no existe', async () => {
  const alumno = await nuevoAlumno();
  const r = await gql(`mutation{ completarTarea(tareaId: 1, tiempoCompletado: 1){ puntos } }`, {}, alumno.token);
  assert.ok(r.errors);
});

test('ejercicio clásico (sin tests): comparación de salida y puntos una sola vez', async () => {
  const alumno = await nuevoAlumno();
  const base = (await gql(`{ tarea(id: 1){ codigoBase tipo } }`, {}, alumno.token)).data.tarea;
  assert.equal(base.tipo, 'codigo');

  const mal = await enviar(alumno.token, 1, base.codigoBase);
  assert.equal(mal.correcto, false);
  assert.equal(mal.puntos, 0);

  const bien = await enviar(alumno.token, 1, await solucionTarea1(alumno.token), 42);
  assert.equal(bien.correcto, true);
  assert.equal(bien.tests, null);
  assert.ok(bien.puntos > 0);

  const otraVez = await enviar(alumno.token, 1, await solucionTarea1(alumno.token));
  assert.equal(otraVez.yaCompletada, true);
  assert.equal(otraVez.puntos, 0);

  const me = (await gql(`{ me { puntos } }`, {}, alumno.token)).data.me;
  assert.equal(me.puntos, bien.puntos);
});

test('retos diarios: la solución ya no se enseña', async () => {
  const alumno = await nuevoAlumno();
  const r = await gql(`{ tareasPorCategoria(categoriaId: 16){ resultadoEsperado } }`, {}, alumno.token);
  assert.ok(r.data.tareasPorCategoria.length > 0);
  for (const t of r.data.tareasPorCategoria) {
    assert.ok(!t.resultadoEsperado.includes('def '), 'resultadoEsperado no debe contener código');
  }
});

test('tests ocultos: el truco del print no funciona y no revelan datos', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Validar Paréntesis');
  const truco = await enviar(alumno.token, reto.id, 'print(True)');
  assert.equal(truco.correcto, false);
  assert.equal(truco.tests.superados, 0);

  const tramposa = 'def es_valido(cadena):\n    return cadena in ("()[]{}", "") or ("(]" not in cadena and cadena.count("(") == cadena.count(")"))';
  const r = await enviar(alumno.token, reto.id, tramposa);
  assert.equal(r.correcto, false);
  assert.ok(r.tests.superados < r.tests.total);
  for (const t of r.tests.resultados.filter((t) => t.oculto)) {
    assert.equal(t.esperado, null);
    assert.equal(t.obtenido, null);
    assert.equal(t.descripcion, 'Test oculto');
  }
});

test('solución correcta de un reto: todos los tests y puntos', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Validar Paréntesis');
  const r = await enviar(alumno.token, reto.id, SOLUCION_PARENTESIS);
  assert.equal(r.correcto, true, r.mensaje);
  assert.equal(r.tests.superados, r.tests.total);
  assert.ok(r.puntos > 0);
});

test('reto del árbol binario resoluble', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Invertir un Árbol Binario');
  const codigo = 'class Nodo:\n    def __init__(self, valor):\n        self.valor = valor\n        self.izquierda = None\n        self.derecha = None\n\ndef invertir_arbol(raiz):\n    if raiz:\n        raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)\n    return raiz';
  const r = await enviar(alumno.token, reto.id, codigo);
  assert.equal(r.correcto, true, r.mensaje);
});

test('reto diario: siempre hay uno y es el mismo durante el día', async () => {
  const a = await nuevoAlumno();
  const b = await nuevoAlumno();
  const r1 = await gql(`{ dailyChallenge { id titulo } }`, {}, a.token);
  const r2 = await gql(`{ dailyChallenge { id } }`, {}, b.token);
  assert.ok(r1.data.dailyChallenge?.id);
  assert.equal(r1.data.dailyChallenge.id, r2.data.dailyChallenge.id);
});

// ---- Fase 0: registro de intentos ----

test('cada envío queda registrado con su tipo de error', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Validar Paréntesis');

  await enviar(alumno.token, reto.id, 'def es_valido(cadena)\n    pass', 10);          // SyntaxError
  await enviar(alumno.token, reto.id, 'def es_valido(cadena):\n    return x', 20);     // NameError en los tests
  await enviar(alumno.token, reto.id, 'def es_valido(cadena):\n    return True', 30);  // tests fallidos
  await enviar(alumno.token, reto.id, SOLUCION_PARENTESIS, 40);                        // correcto

  const intentos = (await gql(MIS_INTENTOS, { id: reto.id }, alumno.token)).data.misIntentos;
  assert.equal(intentos.length, 4);
  // Más reciente primero
  assert.deepEqual(intentos.map((i) => i.correcto), [true, false, false, false]);
  assert.deepEqual(intentos.map((i) => i.tipoError), [null, 'TestsFallidos', 'TestsFallidos', 'SyntaxError']);
  assert.deepEqual(intentos.map((i) => i.segundosEnTarea), [40, 30, 20, 10]);
  assert.equal(intentos[0].testsSuperados, intentos[0].testsTotales);
  assert.equal(intentos[3].codigo, 'def es_valido(cadena)\n    pass');
});

test('errores de ejecución sin tests: NameError, Timeout y salida incorrecta', async () => {
  const alumno = await nuevoAlumno();
  await enviar(alumno.token, 1, 'print(no_existe)');
  await enviar(alumno.token, 1, 'while True: pass');
  await enviar(alumno.token, 1, 'print("hola")');
  const intentos = (await gql(MIS_INTENTOS, { id: '1' }, alumno.token)).data.misIntentos;
  assert.deepEqual(intentos.map((i) => i.tipoError), ['SalidaIncorrecta', 'Timeout', 'NameError']);
});

test('misIntentos solo devuelve los del propio usuario', async () => {
  const a = await nuevoAlumno();
  const b = await nuevoAlumno();
  await enviar(a.token, 1, 'print(1)');
  const deB = (await gql(MIS_INTENTOS, { id: '1' }, b.token)).data.misIntentos;
  assert.equal(deB.length, 0);
  const sinSesion = await gql(MIS_INTENTOS, { id: '1' });
  assert.ok(sinSesion.errors);
});
