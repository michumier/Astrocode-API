# Pruebas de Integración - Astrocode API

Este directorio contiene las pruebas de integración para la API de Astrocode, diseñadas para validar el funcionamiento completo del sistema desde el frontend hasta la base de datos.

## 📋 Casos de Prueba Implementados

### 1. Registro de Usuario (`user-registration.test.ts`)
- ✅ Registro con usuario nuevo
- ✅ Registro con usuario ya existente
- ✅ Registro con email mal formado

### 2. Login de Usuario (`user-login.test.ts`)
- ✅ Login con credenciales válidas
- ✅ Login con contraseña incorrecta
- ✅ Login con campos vacíos
- ✅ Acceso autenticado con token válido

### 3. Ejecución de Ejercicios (`exercise-execution.test.ts`)
- ✅ Código correcto enviado
- ✅ Código incorrecto (fallo lógico)
- ✅ Código con error de sintaxis
- ✅ Código que causa timeout

### 4. Reto Diario (`daily-challenge.test.ts`)
- ✅ Reto disponible
- ✅ No hay reto disponible
- ✅ Error en acceso a BD de retos
- ✅ Completar reto diario

### 5. Clasificación/Ranking (`ranking.test.ts`)
- ✅ Consultar top 5
- ✅ Consultar ranking completo
- ✅ Error de conexión a BD
- ✅ Filtrar ranking
- ✅ Posición del usuario actual

### 6. Recursos Externos (`external-resources.test.ts`)
- ✅ Acceso a recurso válido
- ✅ Recurso no disponible
- ✅ Validación de formato de URL
- ✅ Tracking de clicks en recursos
- ✅ Filtrado de recursos por categoría

## 🚀 Configuración y Ejecución

### Prerrequisitos

1. **Node.js** (versión 16 o superior)
2. **MySQL** (versión 5.7 o superior)
3. **Python** (para ejecución de código)

### Configuración Inicial

1. **Instalar dependencias:**
   ```bash
   cd test/integration
   npm install
   ```

2. **Configurar base de datos:**
   - Crear una base de datos MySQL para pruebas
   - Ajustar las variables en `.env.test` según tu configuración

3. **Configurar variables de entorno:**
   ```bash
   # Copiar y ajustar el archivo de configuración
   cp .env.test .env.local
   # Editar .env.local con tus configuraciones específicas
   ```

### Comandos de Ejecución

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas específicas
npm run test:user          # Solo pruebas de usuario
npm run test:exercise      # Solo pruebas de ejercicios
npm run test:daily         # Solo pruebas de reto diario
npm run test:ranking       # Solo pruebas de ranking
npm run test:resources     # Solo pruebas de recursos

# Ejecutar una prueba específica
npm run test:single "nombre del test"

# Ejecutar en modo debug
npm run test:debug

# Ejecutar con salida verbose
npm run test:verbose
```

### Configuración Manual de Base de Datos

Si necesitas configurar la base de datos manualmente:

```bash
# Configurar base de datos
npm run setup-db

# Limpiar base de datos después de las pruebas
npm run teardown-db
```

## 📁 Estructura de Archivos

```
test/integration/
├── .env.test                    # Variables de entorno para pruebas
├── README.md                    # Esta documentación
├── package.json                 # Configuración de npm y Jest
├── jest.config.js              # Configuración de Jest (alternativa)
├── jest.setup.ts               # Configuración global de Jest
├── global-setup.ts             # Setup global (base de datos, etc.)
├── global-teardown.ts          # Teardown global (limpieza)
├── setup.ts                    # Utilidades de setup para pruebas
├── user-registration.test.ts   # Pruebas de registro de usuario
├── user-login.test.ts          # Pruebas de login de usuario
├── exercise-execution.test.ts  # Pruebas de ejecución de ejercicios
├── daily-challenge.test.ts     # Pruebas de reto diario
├── ranking.test.ts             # Pruebas de ranking
└── external-resources.test.ts  # Pruebas de recursos externos
```

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_USER` | Usuario de la base de datos | `root` |
| `DB_PASSWORD` | Contraseña de la base de datos | `` |
| `DB_NAME` | Nombre de la base de datos de prueba | `astrocode_test` |
| `DB_PORT` | Puerto de la base de datos | `3306` |
| `JWT_SECRET` | Secreto para JWT | `test_jwt_secret_key...` |
| `GRAPHQL_ENDPOINT` | Endpoint de GraphQL | `http://localhost:4001/graphql` |

### Timeouts y Límites

- **Timeout de pruebas:** 30 segundos
- **Timeout de ejecución de código:** 10 segundos
- **Timeout de conexión a BD:** 5 segundos
- **Máximo de workers:** 1 (para evitar conflictos de BD)

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté ejecutándose
sudo service mysql start  # Linux
brew services start mysql # macOS
# En Windows: iniciar desde Services o XAMPP

# Verificar credenciales en .env.test
```

### Error de Timeout en Pruebas
```bash
# Aumentar timeout en jest.config.js o package.json
"testTimeout": 60000  # 60 segundos
```

### Error de Puerto en Uso
```bash
# Cambiar puerto en .env.test
PORT=4002
GRAPHQL_ENDPOINT=http://localhost:4002/graphql
```

### Problemas con Python Runner
```bash
# Verificar que Python esté instalado
python --version
# o
python3 --version

# Ajustar variable en .env.test
PYTHON_EXECUTABLE=python3
```

## 📊 Interpretación de Resultados

### Salida Exitosa
```
✅ Configuración de pruebas de integración cargada
✅ Base de datos de prueba configurada
✅ Todas las pruebas pasaron
✅ Limpieza global completada
```

### Códigos de Salida
- `0`: Todas las pruebas pasaron
- `1`: Una o más pruebas fallaron
- `2`: Error de configuración

## 🤝 Contribuir

Para agregar nuevas pruebas:

1. Crear archivo `nuevo-test.test.ts`
2. Seguir la estructura de los tests existentes
3. Usar las utilidades de `setup.ts`
4. Agregar script en `package.json` si es necesario
5. Documentar en este README

## 📝 Notas Adicionales

- Las pruebas se ejecutan en una base de datos separada (`astrocode_test`)
- Cada prueba limpia sus datos al finalizar
- Se recomienda ejecutar las pruebas en un entorno aislado
- Los logs de error se filtran durante las pruebas para mayor claridad
- Se incluye configuración para debugging con VS Code

---

**Última actualización:** Diciembre 2024
**Versión:** 1.0.0
**Mantenido por:** Equipo Astrocode