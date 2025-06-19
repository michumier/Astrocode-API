<div align="center">
  <img src="../Astrocode-web/client/img/Logo.png" alt="AstroCode Logo" width="200" height="200" style="border-radius: 50%; object-fit: cover;">
  
  # 🛡️ AstroCode API
  
  **Backend GraphQL API para la plataforma AstroCode**
  
  Una robusta API construida con Node.js y GraphQL para gestionar datos y lógica de negocio.
</div>

## 📋 Descripción

AstroCode API es el backend de la plataforma AstroCode, proporcionando una interfaz GraphQL segura y eficiente. La API maneja:

- 🔐 **Autenticación y autorización**: JWT tokens y gestión de sesiones
- 👥 **Gestión de usuarios**: CRUD completo de usuarios y perfiles
- 📊 **Gestión de datos**: Almacenamiento y recuperación de información
- 🔒 **Seguridad**: Validación de datos y protección contra ataques

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Tipado estático
- **GraphQL** - API query language
- **Apollo Server** - Servidor GraphQL
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Encriptación de contraseñas

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Base de datos (MongoDB/PostgreSQL)
- Git

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd Astrocode-API
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env
   PORT=4001
   JWT_SECRET=tu_jwt_secret_aqui
   DB_CONNECTION_STRING=tu_string_de_conexion_db
   NODE_ENV=development
   ```

4. **Configurar base de datos**
   ```bash
   # Ejecutar migraciones si es necesario
   npm run migrate
   ```

5. **Iniciar el servidor**
   ```bash
   npm start
   ```

6. **Acceder a GraphQL Playground**
   ```
   http://localhost:4001/graphql
   ```

## 📁 Estructura del Proyecto

```
Astrocode-API/
├── src/                   # Código fuente
│   ├── config/           # Configuraciones
│   ├── db/               # Configuración de base de datos
│   ├── graphql/          # Esquemas y resolvers GraphQL
│   │   ├── resolvers/    # Resolvers de GraphQL
│   │   ├── typeDefs/     # Definiciones de tipos
│   │   └── schema.ts     # Esquema principal
│   ├── middleware/       # Middlewares personalizados
│   ├── models/           # Modelos de datos
│   ├── utils/            # Utilidades y helpers
│   ├── index.ts          # Punto de entrada
│   └── schema.ts         # Configuración del esquema
├── .gitignore            # Archivos ignorados por Git
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración TypeScript
└── README.md             # Este archivo
```

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Iniciar con nodemon (desarrollo)
npm run dev

# Construir para producción
npm run build

# Ejecutar tests
npm test

# Linting
npm run lint

# Formatear código
npm run format
```

## 📊 Esquema GraphQL

La API expone los siguientes tipos principales:

### Mutations
- `login(input: LoginInput!)`: Autenticación de usuario
- `register(input: RegisterInput!)`: Registro de nuevo usuario
- `updateUser(input: UpdateUserInput!)`: Actualización de perfil

### Queries
- `me`: Información del usuario actual
- `users`: Lista de usuarios (admin)
- `user(id: ID!)`: Usuario específico

### Types
- `User`: Información de usuario
- `AuthPayload`: Respuesta de autenticación
- `LoginInput`: Datos de login
- `RegisterInput`: Datos de registro

## 🔒 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Login**: Envía credenciales y recibe un token
2. **Autorización**: Incluye el token en el header `Authorization: Bearer <token>`
3. **Validación**: El middleware valida el token en cada request protegido

## 🌐 Conexión con el Frontend

El frontend se conecta a esta API en `http://localhost:4001/graphql`. Asegúrate de que:

- El servidor esté ejecutándose en el puerto 4001
- CORS esté configurado para permitir requests desde `http://localhost:3001`
- Las variables de entorno estén correctamente configuradas

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

Desarrollado con ❤️ por el equipo de AstroCode

---

<div align="center">
  <strong>🛡️ ¡Potencia tu aplicación con AstroCode API! 🚀</strong>
</div>