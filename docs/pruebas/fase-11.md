# Plan de pruebas — Fase 11 (🧭 Ruta y candados)

Ramas `feature/fase-11-ruta` en Astrocode-API y Astrocode-web.

- La de la API sale de `feature/fase-10-temario` y lleva dentro el temario (`docs/TEMARIO.md`).
- **La API se fusiona antes que la web**: la web nueva necesita la consulta `ruta`.

## Qué cambia

### API

- **Migración `022_ruta`**:
  - tablas `planetas` (con tema y bonus), `ruta_pasos` y `planetas_conquistados`, con RLS;
  - el orden de los 38 ejercicios sale de `src/db/seeds/ruta.ts`. El número de cada paso es el del temario: los huecos son las lecciones (fase 12) y los ejercicios nuevos (fase 13);
  - quien ya tenía un planeta completo recibe su bonus en la migración.
- **`src/services/ruta.ts`**:
  - `calcularRuta` (cálculo puro, con pruebas unitarias);
  - `rutaDeUsuario`;
  - `bloqueoDeTarea`, que junta el candado de los sabotajes y el de la ruta y dice el motivo;
  - `conquistarSiCompleto`, que da el bonus una sola vez aunque lleguen dos peticiones a la vez.
- **Candados en el servidor**:
  - se comprueban en `tarea`, `enviarSolucion`, `probarMision`, `pedirPista` y la caja negra (las 5 llamadas que antes usaban `puedeAbrirTarea`);
  - no afectan a los admins ni con `RUTA_CANDADOS=0`;
  - los retos diarios, los sabotajes y los retos de calibración no están en la ruta.
- **Reglas**:
  - dentro de un planeta, un paso se abre al completar los anteriores, y lo hecho siempre se puede repetir;
  - un planeta se abre al conquistar el anterior, o si el alumno ya tenía algo hecho en él (nadie queda bloqueado delante de lo que ya superó).
- **GraphQL**:
  - nueva consulta `ruta` (planetas en orden con el estado de cada paso);
  - `enviarSolucion` devuelve `planetaConquistado`.
- **e2e**: la pila de pruebas tiene una segunda API, `astrocode-api-ruta`, con los candados puestos y sobre la misma base de datos. Las pruebas de siempre van sin candados, porque envían soluciones a tareas sueltas.

### Web

- `utils/planetas.ts` (reparto por nivel y puntos) se sustituye por `utils/ruta.ts`, que lee la ruta de la API.
- **Mapa**:
  - candados con el nombre del planeta y su motivo («Conquista Venus para abrir Tierra.»);
  - bandera en los conquistados;
  - el panel de la izquierda enseña el tema y la barra de conquista con el bonus.
- **Panel del planeta**:
  - pasos numerados en orden;
  - solo el siguiente tiene «Empezar»; los hechos tienen «Repetir» y los demás, candado;
  - en la cabecera, el tema y «+N pts al conquistarlo» o «Conquistado».
- **Enhorabuena**: con el último paso, «¡Has conquistado Mercurio! +100 pts y se abre el siguiente planeta».
- **Perfil**:
  - rumbo con los pasos que faltan para conquistar el planeta en curso;
  - constelaciones con su estado;
  - los hitos «Constelación completa», «Rumbo a Marte» y «Hasta Saturno» dependen ahora de la ruta, no de los puntos.
- **Bienvenida**: explica la ruta en lugar de los umbrales de puntos.
- **Abrir un paso bloqueado por URL** enseña el motivo que da la API. Antes salía siempre el mensaje de los sabotajes.

## Pruebas automáticas

| Prueba | Resultado |
|---|---|
| API: `npx tsc --noEmit` | ✅ |
| API: `npm test`, con 7 nuevas de `calcularRuta` | ✅ 15/15 |
| API: `npm run e2e:docker`, con 4 nuevas en `16-ruta.test.mjs` | ✅ **124/124** |
| Web: `npx tsc --noEmit` | ✅ |
| Web: pruebas, con `ruta.test.ts`, el panel con candados y el perfil con la ruta | ✅ 45/45 |
| Web: `CI=true react-scripts build` | ✅ sin avisos |

Las 4 e2e de la ruta comprueban:
1. Los 6 planetas en orden con sus bonus. Quien empieza solo tiene abierto el paso 1 de Mercurio.
2. No se puede abrir ni enviar un paso bloqueado («pasos anteriores de Mercurio»), ni uno de un planeta cerrado («Conquista Mercurio para abrir Venus»). Los retos diarios siguen libres.
3. Paso a paso hasta conquistar Mercurio:
   - el bonus llega solo con el último paso;
   - los puntos son los de los ejercicios más 100;
   - Venus se abre;
   - repetir un paso no vuelve a dar el bonus.
4. Los admins no tienen candados.

## Pruebas manuales

En la pila aislada, web en :3100, con `RUTA_CANDADOS=1`:

| Paso | Resultado |
|---|---|
| Cuenta nueva → mapa | ✅ solo Mercurio abierto; el resto, con candado y nombre |
| Pulsar Venus (cerrado) | ✅ aviso «Conquista Mercurio para abrir Venus.» |
| Panel de Mercurio | ✅ «Primer contacto», «0 de 4 hechos · +100 pts al conquistarlo», paso 1 con «Empezar» y 2–4 con candado |
| Abrir `/ejercicio/19` por URL | ✅ «Completa antes los pasos anteriores de Mercurio.» (tras arreglar el mensaje fijo de sabotajes) |
| Pasos 1–3 enviados, sin conquista todavía | ✅ |
| Paso 4 resuelto en el editor | ✅ «¡Ejercicio superado!» y «¡Has conquistado Mercurio! +100 pts» |
| Vuelta al mapa | ✅ Mercurio con bandera, Venus abierto, 600 pts, constelación en curso: Venus (0 de 6) |
| Perfil | ✅ «Te faltan 6 pasos para conquistar Venus y abrir Tierra», Mercurio «Conquistado», el resto con su motivo; hito «Constelación completa» conseguido |

## Despliegue

- La migración 022 se aplica sola en el primer arranque de la API en Vercel.
- En Vercel no hay que tocar nada: sin `RUTA_CANDADOS`, los candados están puestos.
- **Orden**:
  1. fusionar la API;
  2. comprobar que la API desplegada responde a `{ ruta { clave } }`;
  3. fusionar la web.
