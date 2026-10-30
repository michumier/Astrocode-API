import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno, enviar, retoPorTitulo, solucionTarea1, tareaSinTests } from './helpers.mjs';

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

test('ejercicio de los planetas: se corrige con sus tests (fase 7) y puntúa una sola vez', async () => {
  const alumno = await nuevoAlumno();
  const base = (await gql(`{ tarea(id: 1){ codigoBase tipo } }`, {}, alumno.token)).data.tarea;
  assert.equal(base.tipo, 'codigo');

  const mal = await enviar(alumno.token, 1, base.codigoBase);
  assert.equal(mal.correcto, false);
  assert.equal(mal.puntos, 0);

  const bien = await enviar(alumno.token, 1, await solucionTarea1(alumno.token), 42);
  assert.equal(bien.correcto, true);
  // Fase 7: el ejercicio 1 tiene un test visible (salida completa) y uno oculto (la variable)
  assert.equal(bien.tests.total, 2);
  assert.equal(bien.tests.superados, 2);
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
  const id = await tareaSinTests();
  await enviar(alumno.token, id, 'print(no_existe)');
  await enviar(alumno.token, id, 'while True: pass');
  await enviar(alumno.token, id, 'print("hola")');
  const intentos = (await gql(MIS_INTENTOS, { id }, alumno.token)).data.misIntentos;
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

test('retos diarios (fase 7): sin copias repetidas, con los 2 nuevos y se superan con su solución', async () => {
  const alumno = await nuevoAlumno();
  const retos = (await gql(`{ tareasPorCategoria(categoriaId: 16){ id titulo codigoBase } }`, {}, alumno.token)).data.tareasPorCategoria;
  const titulos = retos.map((r) => r.titulo);
  assert.equal(new Set(titulos).size, titulos.length, `títulos repetidos: ${titulos}`);
  assert.equal(retos.length, 5);
  const soluciones = {
    'Comprimir una señal': 'def comprimir(senal):\n    s = ""\n    i = 0\n    while i < len(senal):\n        j = i\n        while j < len(senal) and senal[j] == senal[i]:\n            j += 1\n        s += senal[i] + str(j - i)\n        i = j\n    return s',
    'Dos señales que suman el objetivo': 'def dos_suma(numeros, objetivo):\n    for i in range(len(numeros)):\n        for j in range(i + 1, len(numeros)):\n            if numeros[i] + numeros[j] == objetivo:\n                return (i, j)',
  };
  for (const [titulo, codigo] of Object.entries(soluciones)) {
    const reto = retos.find((r) => r.titulo === titulo);
    assert.ok(reto, `falta «${titulo}»`);
    assert.equal((await enviar(alumno.token, reto.id, reto.codigoBase)).correcto, false);
    const r = await enviar(alumno.token, reto.id, codigo);
    assert.equal(r.correcto, true, `${titulo}: ${JSON.stringify(r.tests)}`);
    assert.equal(r.tests.total, 5);
  }
});
