// Fase 13: «qué practicas / por qué», la lección para repasar y un ejercicio nuevo corregido de verdad.
// Va contra la API sin candados (la de siempre), con un alumno normal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, nuevoAlumno, enviar } from './helpers.mjs';

const alumno = await nuevoAlumno();
const T = alumno.token;

const RUTA = '{ ruta { clave total pasos { tipo tarea { id titulo } leccion { id titulo } } } }';
const ruta = (await gql(RUTA, {}, T)).data.ruta;
const tareaPorTitulo = (titulo) => ruta.flatMap((p) => p.pasos).find((s) => s.tarea?.titulo === titulo)?.tarea;

const DETALLE = `query($id:ID!){ tarea(id:$id){ titulo practica porque leccionRepaso { id titulo } } }`;

test('la ruta completa: 28 lecciones y 44 ejercicios', () => {
  const pasos = ruta.flatMap((p) => p.pasos);
  assert.equal(pasos.filter((s) => s.tipo === 'leccion').length, 28);
  assert.equal(pasos.filter((s) => s.tipo === 'tarea').length, 44);
});

test('cada ejercicio de la ruta dice qué practicas y por qué', async () => {
  const tareas = ruta.flatMap((p) => p.pasos).filter((s) => s.tarea).map((s) => s.tarea);
  for (const t of tareas) {
    const { data } = await gql(DETALLE, { id: t.id }, T);
    assert.ok(data.tarea.practica?.length > 10, `sin «qué practicas»: ${t.titulo}`);
    assert.ok(data.tarea.porque?.length > 40, `sin «por qué»: ${t.titulo}`);
  }
});

test('el ejercicio enlaza la lección anterior de su planeta para repasar', async () => {
  const { data } = await gql(DETALLE, { id: '1' }, T);
  assert.equal(data.tarea.leccionRepaso.titulo, 'Variables: cajas con nombre');
  // El primer paso de Júpiter es una lección, y el ejercicio que va justo después la enlaza
  const senales = (await gql(DETALLE, { id: '21' }, T)).data.tarea;
  assert.equal(senales.leccionRepaso.titulo, 'Comprensiones de listas');
  // Los retos diarios no están en la ruta
  assert.equal((await gql(DETALLE, { id: '47' }, T)).data.tarea.leccionRepaso, null);
});

test('los ejercicios nuevos están en su sitio de la ruta', () => {
  const sitio = (titulo) => ruta.find((p) => p.pasos.some((s) => s.tarea?.titulo === titulo))?.clave;
  assert.deepEqual(
    ['Informe de despegue', 'Semáforo de la plataforma', 'Repostaje hasta llenar', 'Inventario de la bodega', 'Cuenta atrás recursiva', 'Tu propia nave'].map(sitio),
    ['mercurio', 'venus', 'tierra', 'marte', 'saturno', 'saturno'],
  );
});

const CUENTA_ATRAS = `def cuenta_atras(n):
    if n == 0:
        print("¡Despegue!")
        return
    print(n)
    cuenta_atras(n - 1)

def suma_hasta(n):
    if n == 0:
        return 0
    return n + suma_hasta(n - 1)

def potencia(base, exponente):
    if exponente == 0:
        return 1
    return base * potencia(base, exponente - 1)

cuenta_atras(3)
print(suma_hasta(10))
print(potencia(2, 8))
`;

test('«Cuenta atrás recursiva» se corrige en el runner: la solución recursiva pasa y con bucles no', async () => {
  const { id } = tareaPorTitulo('Cuenta atrás recursiva');
  const conBucle = CUENTA_ATRAS.replace(
    'def suma_hasta(n):\n    if n == 0:\n        return 0\n    return n + suma_hasta(n - 1)',
    'def suma_hasta(n):\n    total = 0\n    for i in range(n + 1):\n        total += i\n    return total',
  );
  const mal = await enviar(T, id, conBucle);
  assert.equal(mal.correcto, false);
  const sinBucles = mal.tests.resultados.find((r) => r.oculto && !r.superado);
  assert.ok(sinBucles, 'el test oculto «Sin bucles» debería fallar');

  const bien = await enviar(T, id, CUENTA_ATRAS);
  assert.equal(bien.correcto, true, JSON.stringify(bien.tests?.resultados));
  assert.equal(bien.tests.superados, bien.tests.total);
});
