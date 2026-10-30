// Utilidades compartidas por las pruebas e2e (se ejecutan contra la API en marcha)
export const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';

// Debe coincidir con ADMIN_EMAILS en test/e2e/compose.e2e.yml
export const ADMIN_EMAIL = 'admin-e2e@example.test';
const ADMIN_PASSWORD = 'Admin-e2e-local-1';

export async function gql(query, variables = {}, token) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export const codigoError = (r) => r.errors?.[0]?.extensions?.code;

export const unico = (prefijo) => `${prefijo}${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function login(email, contrasena) {
  const r = await gql(`mutation($i: LoginInput!){ login(input:$i){ token usuario { id rol puntos } } }`, {
    i: { correo_electronico: email, contrasena },
  });
  return r.data?.login || null;
}

// Crea un alumno nuevo (único por llamada) y devuelve { token, usuario, contrasena, email }
export async function nuevoAlumno() {
  const nombre = unico('alumno');
  const email = `${nombre}@example.test`;
  const contrasena = `Prueba-${Math.random().toString(36).slice(2)}`;
  const r = await gql(`mutation($i: CrearUsuarioInput!){ crearUsuario(input:$i){ id } }`, {
    i: { nombre_usuario: nombre, correo_electronico: email, contrasena },
  });
  if (r.errors) throw new Error(`No se pudo crear el alumno: ${r.errors[0].message}`);
  return { ...(await login(email, contrasena)), contrasena, email };
}

// El admin de pruebas se crea la primera vez y se reutiliza después
export async function admin() {
  let sesion = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!sesion) {
    await gql(`mutation($i: CrearUsuarioInput!){ crearUsuario(input:$i){ id } }`, {
      i: { nombre_usuario: unico('admin'), correo_electronico: ADMIN_EMAIL, contrasena: ADMIN_PASSWORD },
    });
    sesion = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  }
  if (!sesion || sesion.usuario.rol !== 'admin') {
    throw new Error(`El admin de pruebas no está disponible (¿ADMIN_EMAILS incluye ${ADMIN_EMAIL}?)`);
  }
  return sesion;
}

export const ENVIAR_SOLUCION = `mutation($id:ID!,$c:String!,$t:Int!){ enviarSolucion(tareaId:$id, codigo:$c, tiempoCompletado:$t){
  correcto yaCompletada puntos mensaje
  ejecucion { stdout stderr status { id description } }
  tests { superados total resultados { descripcion oculto superado esperado obtenido error } }
} }`;

export async function enviar(token, tareaId, codigo, segundos = 30) {
  const r = await gql(ENVIAR_SOLUCION, { id: String(tareaId), c: codigo, t: segundos }, token);
  if (r.errors) throw new Error(r.errors[0].message);
  return r.data.enviarSolucion;
}

export async function ejecutar(token, codigo) {
  const r = await gql(`mutation($c:String!){ executeCode(input:{sourceCode:$c}){ stdout stderr status { id description } } }`, { c: codigo }, token);
  if (r.errors) throw new Error(r.errors[0].message);
  return r.data.executeCode;
}

export async function retoPorTitulo(token, titulo) {
  const r = await gql(`{ tareasPorCategoria(categoriaId: 16){ id titulo resultadoEsperado tipo } }`, {}, token);
  return r.data.tareasPorCategoria.find((t) => t.titulo === titulo);
}

// Solución del ejercicio 1 (variables) a partir de su código base
export async function solucionTarea1(token) {
  const r = await gql(`{ tarea(id: 1){ codigoBase } }`, {}, token);
  return r.data.tarea.codigoBase.replace('# TODO: crea la variable edad con el valor 25', 'edad = 25');
}

// Tarea «clásica» sin tests ni solución (se corrige comparando la salida). Desde la fase 7 los
// ejercicios de la BD tienen tests, así que las pruebas que necesitan una la crean como admin.
export async function tareaSinTests() {
  const A = (await admin()).token;
  const r = await gql(
    `mutation($i:CrearTareaInput!){ crearTarea(input:$i){ id } }`,
    { i: { categoriaId: '1', nivelId: '1', titulo: unico('Sin tests '), descripcion: 'Imprime hola mundo', codigoBase: '', resultadoEsperado: 'hola mundo' } },
    A
  );
  if (r.errors) throw new Error(r.errors[0].message);
  return r.data.crearTarea.id;
}

// Copia de «Validar Paréntesis» con su solución y tests, para las pruebas de sabotaje que necesitan
// una tarea limpia (antes usaban las copias repetidas del reto diario, que la fase 7 quitó)
export async function copiaParentesis() {
  const A = (await admin()).token;
  const casos = [['()[]{}', 'True', false], ['(]', 'False', false], ['{[()]}', 'True', true], ['([)]', 'False', true], ['((', 'False', true], ['', 'True', true]];
  const r = await gql(
    `mutation($i:CrearTareaInput!){ crearTarea(input:$i){ id } }`,
    {
      i: {
        categoriaId: '10', nivelId: '1', titulo: unico('Paréntesis e2e '), descripcion: 'Copia para pruebas de sabotaje',
        codigoBase: 'def es_valido(cadena):\n    pass\n', resultadoEsperado: 'es_valido("()[]{}")  →  True',
        solucion: 'def es_valido(cadena):\n    pila = []\n    mapa = {")": "(", "}": "{", "]": "["}\n    for char in cadena:\n        if char in mapa:\n            elemento_pop = pila.pop() if pila else "#"\n            if mapa[char] != elemento_pop:\n                return False\n        else:\n            pila.append(char)\n    return not pila\n',
        tests: casos.map(([c, s, o]) => ({ descripcion: `es_valido(${JSON.stringify(c)})`, codigoTest: `print(es_valido(${JSON.stringify(c)}))`, salidaEsperada: s, oculto: o })),
      },
    },
    A
  );
  if (r.errors) throw new Error(r.errors[0].message);
  return r.data.crearTarea.id;
}
