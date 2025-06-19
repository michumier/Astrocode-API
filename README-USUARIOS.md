# API de Usuarios - Astrocode

## Configuración

1. Copia el archivo `.env.example` a `.env` y configura las variables:
```bash
cp .env.example .env
```

2. Asegúrate de tener las siguientes variables configuradas:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`: Configuración de MySQL
- `JWT_SECRET`: Secreto para firmar los tokens JWT
- `PORT`: Puerto del servidor (por defecto 4000)

## Esquema de Usuario

### Tipo Usuario
```graphql
type Usuario {
  id: ID!
  nombre_usuario: String!
  correo_electronico: String!
  nombre_completo: String
  puntos: Int
  creado_el: String
}
```

## Queries Disponibles

### 1. Obtener todos los usuarios
```graphql
query {
  usuarios {
    id
    nombre_usuario
    correo_electronico
    nombre_completo
    puntos
    creado_el
  }
}
```

### 2. Obtener un usuario por ID
```graphql
query {
  usuario(id: "1") {
    id
    nombre_usuario
    correo_electronico
    nombre_completo
    puntos
  }
}
```

### 3. Obtener usuario por email
```graphql
query {
  usuarioPorEmail(correo_electronico: "usuario@ejemplo.com") {
    id
    nombre_usuario
    correo_electronico
  }
}
```

### 4. Obtener usuario actual (requiere autenticación)
```graphql
query {
  me {
    id
    nombre_usuario
    correo_electronico
    nombre_completo
    puntos
  }
}
```

## Mutations Disponibles

### 1. Crear usuario
```graphql
mutation {
  crearUsuario(input: {
    nombre_usuario: "nuevo_usuario"
    correo_electronico: "nuevo@ejemplo.com"
    contrasena: "contraseña123"
    nombre_completo: "Nombre Completo"
  }) {
    id
    nombre_usuario
    correo_electronico
    nombre_completo
    puntos
  }
}
```

### 2. Login
```graphql
mutation {
  login(input: {
    correo_electronico: "usuario@ejemplo.com"
    contrasena: "contraseña123"
  }) {
    token
    usuario {
      id
      nombre_usuario
      correo_electronico
      nombre_completo
      puntos
    }
  }
}
```

### 3. Actualizar usuario (requiere autenticación)
```graphql
mutation {
  actualizarUsuario(id: "1", input: {
    nombre_completo: "Nuevo Nombre"
    puntos: 100
  }) {
    id
    nombre_usuario
    nombre_completo
    puntos
  }
}
```

### 4. Eliminar usuario (requiere autenticación)
```graphql
mutation {
  eliminarUsuario(id: "1")
}
```

### 5. Cambiar contraseña (requiere autenticación)
```graphql
mutation {
  cambiarContrasena(
    id: "1"
    contrasenaActual: "contraseña_actual"
    nuevaContrasena: "nueva_contraseña"
  )
}
```

## Autenticación

Para las operaciones que requieren autenticación, incluye el token JWT en el header:

```
Authorization: Bearer tu_token_jwt_aqui
```

## Seguridad

- Las contraseñas se hashean con bcrypt (12 rounds)
- Los tokens JWT expiran en 7 días
- Solo el propio usuario puede actualizar/eliminar su cuenta
- Validación de emails únicos y nombres de usuario únicos

## Errores Comunes

- `AuthenticationError`: Token inválido o faltante
- `UserInputError`: Datos de entrada inválidos (email/usuario ya existe)
- `ForbiddenError`: Sin permisos para realizar la operación

## Estructura de la Base de Datos

La tabla `usuarios` debe tener la siguiente estructura:

```sql
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario TEXT NOT NULL UNIQUE,
    correo_electronico TEXT NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    nombre_completo TEXT,
    puntos INTEGER DEFAULT 0,
    creado_el TIMESTAMP DEFAULT now()
);
```