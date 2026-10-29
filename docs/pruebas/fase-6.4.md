# Plan de pruebas — Fase 6.4 (🎨 Rediseño: acceso)

Ramas: `feature/fase-6.4-acceso` en Astrocode-web (el código) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.3.

## Qué cambia
- **Una sola pantalla de acceso** (`views/acceso/Acceso.tsx`, `Acceso.css`). Sustituye a `views/login` (App, Register y Welcome):
  - **a la izquierda, la promesa:** logo, «Aprende Python viajando por el sistema solar» y tres puntos (planetas, misiones y retos, AstroTutor);
  - **a la derecha, una tarjeta** con pestañas accesibles «Entrar» / «Crear cuenta». Detrás gira el sistema solar del mapa (`SistemaDecorativo`: los mismos planetas, sin botones);
  - **formulario de verdad:**
    - `<form>` con Enter;
    - etiquetas visibles y `autocomplete` (correo, contraseña actual o nueva, usuario);
    - botón para mostrar u ocultar la contraseña;
  - **errores junto a cada campo**, con las mismas reglas que la API: usuario de 3 a 30 caracteres, correo válido, contraseña de 8 o más y que coincidan. El foco va al primero que hay que corregir;
  - **mensajes claros:** «El correo o la contraseña no son correctos», «Ya hay una cuenta con ese nombre de usuario o ese correo», sin conexión…;
  - **un único botón en oro** por pestaña.
- **Seguridad:** antes, al registrarse, **la contraseña se guardaba en texto plano en `localStorage`** (`tempLoginData`) para entrar sola después de la bienvenida. Ahora se entra justo después de crear la cuenta, con la contraseña solo en memoria, y se olvida.
- **Al cambiar de pestaña** se conserva el correo, pero no la contraseña.
- Entrar y crear cuenta usan **Apollo** (`useMutation`), no `fetch` a mano; fuera los `console.log` de depuración.
- **Bienvenida** (`Bienvenida.tsx`), tres pasos tras crear la cuenta:
  1. el sistema solar;
  2. una constelación de ejemplo;
  3. misiones, sabotajes, retos y AstroTutor.

  El texto sale de los datos reales: antes decía «Comienza en la Tierra» y se empieza con Mercurio, Venus y la Tierra abiertos. Los puntos de paso son botones con nombre y `aria-current`, y el foco va al título de cada paso. Se puede saltar.
- **Kit:** `Campo` admite un `accesorio` dentro del campo (el ojo de la contraseña).
- Fuera las tres ilustraciones viejas (`public/img/welcome-*.svg`) y los avisos de build de login y registro.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Entrar sin datos: errores en los campos, `aria-invalid` y no se llama a la API | `Acceso.test.tsx` |
| A2 | Entrar bien: guarda token y usuario y avisa al router | `Acceso.test.tsx` |
| A3 | Credenciales malas: «El correo o la contraseña no son correctos» y sin sesión | `Acceso.test.tsx` |
| A4 | Mostrar la contraseña cambia el tipo del campo | `Acceso.test.tsx` |
| A5 | Reglas del registro iguales a las de la API | `Acceso.test.tsx` |
| A6 | Crear cuenta: entra al momento, enseña la bienvenida y **la contraseña no aparece en ningún valor de `localStorage`** | `Acceso.test.tsx` |
| A7 | Bienvenida: tres pasos, foco en el título, sin «Saltar» en el último e «Ir al mapa» | `Acceso.test.tsx` |
| A8 | Regresión del resto | 34/34 en total |
| A9 | Tipos, build (solo queda el aviso del perfil, 6.5) y detector de Impeccable: 0 hallazgos | `tsc`, `npm run build`, `impeccable detect` |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir `/login` a 1280 px | Promesa a la izquierda, tarjeta a la derecha con el sistema solar girando detrás |
| M2 | Entrar con un correo que no existe | Aviso «No se pudo entrar · El correo o la contraseña no son correctos»; sin token |
| M3 | «Crear cuenta» y enviar con datos a medias | Error en cada campo que falla y el foco en el primero |
| M4 | Crear una cuenta válida | Bienvenida con el nombre; en `localStorage` solo `token` y `usuario` |
| M5 | Los tres pasos e «Ir al mapa» | Sistema solar, constelación y formatos; acaba en el mapa |
| M6 | Cerrar sesión y volver a entrar con la cuenta nueva | Vuelve al mapa con la sesión |
| M7 | Sin sesión, abrir `/ranking`, crear cuenta y saltar | Acaba en `/ranking` |
| M8 | axe-core en las dos pestañas (también con errores) y en la bienvenida | Sin infracciones |
| M9 | Móvil (375 px) | Sin scroll horizontal; promesa arriba y tarjeta debajo |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A9 | ✅ 34/34, tipos, build y detector | |
| M1–M7 | ✅ | Arreglado en la prueba: el sistema del primer paso de la bienvenida no estaba centrado y salía recortado |
| M8 | ✅ | Arreglado en la prueba: `role="tabpanel"` no vale en un `<form>` → va en un `div` que lo envuelve |
| M9 | ✅ | |

## 4. Notas
- Con el panel del navegador oculto, las capturas de los pasos 2 y 3 salían sin repintar; se comprobó por el DOM (contenido, opacidad, foco y paso actual).
- Las cuentas de prueba se crearon con datos generados en la pila aislada, que se borra con `down -v`.
