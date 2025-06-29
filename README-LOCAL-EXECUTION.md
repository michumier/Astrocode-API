# 🐍 Sistema de Ejecución Local de Python - AstroCode API

## 📋 Descripción

Este sistema permite ejecutar código Python localmente usando contenedores Docker, eliminando la dependencia de APIs externas como Judge0.

## 🏗️ Arquitectura

```
Astrocode-API/
├── src/                     # Código fuente del backend GraphQL
├── python-runner/           # Contenedor para ejecutar Python
│   ├── Dockerfile
│   ├── requirements.txt
│   └── runner.py
├── docker-compose.yml       # Orquestación de servicios
├── Dockerfile              # Contenedor del backend
└── package.json            # Dependencias del backend
```

## 🚀 Ejecución Rápida

### Prerrequisitos
- Docker Desktop instalado y ejecutándose
- Puertos 4000 y 5000 disponibles

### Comandos

```bash
# Navegar a la carpeta de la API
cd Astrocode-API

# Construir y ejecutar todos los servicios
docker-compose up --build

# En segundo plano (opcional)
docker-compose up --build -d
```

## 🧪 Verificación del Sistema

### 1. Verificar Python Runner
```bash
curl http://localhost:5000/health
# Respuesta esperada: {"status": "healthy"}
```

### 2. Probar Ejecución de Código
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello from local Python!\")"}'
```

### 3. Verificar GraphQL Backend
```bash
curl http://localhost:4000/graphql
# Debería devolver el playground de GraphQL
```

### 4. Probar Mutación GraphQL
```graphql
mutation {
  executeCode(input: {
    sourceCode: "print('Hello from GraphQL!')"
    languageId: 71
  }) {
    stdout
    stderr
    status {
      id
      description
    }
    time
  }
}
```

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f astrocode-api
docker-compose logs -f python-runner

# Parar servicios
docker-compose down

# Reconstruir sin caché
docker-compose build --no-cache

# Ver estado de contenedores
docker-compose ps
```

## 🌐 URLs de Acceso

- **Python Runner**: http://localhost:5000
- **GraphQL API**: http://localhost:4000/graphql
- **Health Check**: http://localhost:5000/health

## 🔒 Seguridad

- Ejecución en contenedores aislados
- Timeout de 5 segundos para código Python
- Sin acceso a sistema de archivos del host
- Límites de memoria y CPU por contenedor

## 🐛 Solución de Problemas

### Puerto en uso
```bash
# Verificar qué está usando el puerto
netstat -ano | findstr :4000
netstat -ano | findstr :5000
```

### Limpiar contenedores
```bash
docker-compose down
docker system prune -f
```

### Reconstruir completamente
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 📝 Notas de Desarrollo

- El código fuente se monta como volumen para desarrollo
- Los cambios en `src/` se reflejan automáticamente
- Para cambios en dependencias, reconstruir el contenedor
- La comunicación entre servicios usa la red interna de Docker

## 🎯 Ventajas del Sistema Local

✅ **Sin dependencias externas**  
✅ **Ejecución más rápida**  
✅ **Sin costos de API**  
✅ **Fácil debugging**  
✅ **Escalable y configurable**  
✅ **Arquitectura de microservicios**  

¡El sistema está listo para ejecutar código Python de forma local y segura! 🎉