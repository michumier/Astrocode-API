// Servidor falso compatible con la API de NVIDIA/OpenAI para las pruebas e2e (no necesita API key).
// - Si el system prompt pide un JSON, devuelve un ejercicio con un test mal hecho a propósito.
// - Si el código del alumno contiene FILTRAR, "se salta las reglas" y devuelve la solución.
// - Si no, devuelve una pista de prueba con el modelo y si llegó la cabecera Authorization.
import http from 'node:http';

const ejercicio = {
  titulo: 'Contador de vocales de radio',
  descripcion: 'Escribe la función contar_vocales(mensaje) que devuelva cuántas vocales tiene un mensaje de radio.',
  codigoBase: 'def contar_vocales(mensaje):\n    # Tu código aquí\n    pass',
  solucion: 'def contar_vocales(mensaje):\n    return sum(1 for c in mensaje.lower() if c in "aeiouáéíóú")',
  resultadoEsperado: 'contar_vocales("Hola nave")  →  4',
  tests: [
    { descripcion: 'Mensaje simple', codigoTest: 'print(contar_vocales("Hola nave"))', salidaEsperada: '4', oculto: false },
    { descripcion: 'Vacío', codigoTest: 'print(contar_vocales(""))', salidaEsperada: '0', oculto: false },
    { descripcion: 'Mayúsculas', codigoTest: 'print(contar_vocales("AEIOU"))', salidaEsperada: '5', oculto: true },
    { descripcion: 'Test MAL generado', codigoTest: 'print(contar_vocales("xyz"))', salidaEsperada: '3', oculto: true },
  ],
};

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const auth = req.headers.authorization || '';
    const json = JSON.parse(body || '{}');
    const sistema = json.messages?.[0]?.content || '';
    const usuario = json.messages?.[1]?.content || '';
    let content;
    if (sistema.includes('saboteador')) {
      // Sabotaje "con IA": recibe la solución numerada ("  7|     codigo") y cambia la última línea
      // que tenga una comparación o un `not` (la sangría se omite a propósito: la API debe conservarla)
      const numerada = usuario.split('<solucion_correcta>\n')[1]?.split('\n</solucion_correcta>')[0] || '';
      const lineas = numerada.split('\n').map((l) => ({ n: Number(l.slice(0, 3)), texto: l.slice(5) }));
      const cambiosPosibles = [[' != ', ' == '], [' == ', ' != '], [' < ', ' <= '], [' > ', ' >= '], ['not ', '']];
      let cambio = null;
      for (const linea of [...lineas].reverse()) {
        const par = cambiosPosibles.find(([a]) => linea.texto.includes(a));
        if (par && !/^\s*(def|class)\s/.test(linea.texto)) {
          cambio = { linea: linea.n, nuevo: linea.texto.replace(par[0], par[1]).trim(), descripcion: `mock: '${par[0].trim()}' por '${par[1].trim()}'` };
          break;
        }
      }
      content = JSON.stringify({
        cambios: cambio ? [{ linea: cambio.linea, nuevo: cambio.nuevo }] : [],
        descripcion: cambio?.descripcion || 'sin cambios',
        contexto: 'La IA de a bordo sospecha de una condición.',
      });
    } else if (sistema.includes('objeto JSON')) {
      content = '```json\n' + JSON.stringify(ejercicio) + '\n```';
    } else if (usuario.includes('FUGA_SABOTAJE')) {
      // Simula una IA que, en una pista de sabotaje, dice la línea exacta
      content = 'El problema está en la línea 5, revísala.';
    } else if (usuario.includes('FILTRAR')) {
      // Simula una IA que se salta las reglas y suelta la solución
      const sol = usuario.split('no la reveles):\n')[1]?.split('\n<codigo_alumno>')[0] || '';
      content = 'Aquí tienes: ' + sol;
    } else {
      const razonamiento = json.chat_template_kwargs?.enable_thinking === false ? 'off' : 'on';
      // Si la pista es de un sabotaje, se indica para que las pruebas comprueben que llega la información
      const sabotaje = usuario.includes('MISIÓN DE SABOTAJE')
        ? `, sabotaje, solucion ${usuario.includes('Solución de referencia') ? 'si' : 'no'}, confidencial ${usuario.includes('CONFIDENCIAL:') ? 'si' : 'no'}`
        : usuario.includes('MISIÓN DE PILOTAJE')
          ? `, mision, solucion ${usuario.includes('Solución de referencia') ? 'si' : 'no'}`
          : '';
      content = `Pista de prueba (modelo ${json.model}, auth ${auth.startsWith('Bearer ') ? 'ok' : 'NO'}, razonamiento ${razonamiento}${sabotaje}): piensa en cómo recorrer cada elemento.`;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }));
  });
}).listen(Number(process.env.PORT || 8787), () => console.log(`mock IA escuchando en :${process.env.PORT || 8787}`));
