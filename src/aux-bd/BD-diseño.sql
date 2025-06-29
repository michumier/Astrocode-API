-- Usa tu base de datos
USE astrocodebd;

-- ================================
-- Tabla: embeddings
-- ================================
-- MySQL no tiene tipo vector, así que guardaremos el vector como JSON o BLOB.
-- Aquí lo guardo como JSON, que es legible y flexible.

CREATE TABLE embeddings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    embedding JSON NOT NULL
);

-- ================================
-- Tabla: migrations
-- ================================

CREATE TABLE migrations (
    version VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- Tabla: usuarios
-- ================================

CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(255) NOT NULL UNIQUE,
    correo_electronico VARCHAR(255) NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    nombre_completo VARCHAR(255),
    puntos INT DEFAULT 0,
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- Tabla: niveles
-- ================================

CREATE TABLE niveles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    puntos INT NOT NULL
);

-- ================================
-- Tabla: categorias
-- ================================

CREATE TABLE categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
);

-- ================================
-- Tabla: tiempos_finalizacion
-- ================================
-- En lugar de INTERVAL usamos TIME para duraciones.

CREATE TABLE tiempos_finalizacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    umbral TIME NOT NULL,
    puntos_bonus INT NOT NULL
);

-- ================================
-- Tabla: insignias
-- ================================

CREATE TABLE insignias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    url_imagen VARCHAR(512)
);

-- ================================
-- Tabla: tareas
-- ================================

CREATE TABLE tareas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    categoria_id BIGINT NOT NULL,
    nivel_id BIGINT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_vencimiento DATE,
    prioridad INT CHECK (prioridad BETWEEN 1 AND 5),
    completado BOOLEAN DEFAULT FALSE,
    tiempo_finalizacion_id BIGINT,
    puntos_base INT,
    puntos_bonus INT DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (nivel_id) REFERENCES niveles(id),
    FOREIGN KEY (tiempo_finalizacion_id) REFERENCES tiempos_finalizacion(id)
);

-- ================================
-- Tabla: tareas_usuarios
-- ================================

CREATE TABLE tareas_usuarios (
    usuario_id BIGINT NOT NULL,
    tarea_id BIGINT NOT NULL,
    completado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tiempo_completado TIME,
    puntos_base INT,
    puntos_bonus INT,
    puntos_totales INT,
    PRIMARY KEY (usuario_id, tarea_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (tarea_id) REFERENCES tareas(id)
);

-- ================================
-- Tabla: insignias_usuarios
-- ================================

CREATE TABLE insignias_usuarios (
    usuario_id BIGINT NOT NULL,
    insignia_id BIGINT NOT NULL,
    ganado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, insignia_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (insignia_id) REFERENCES insignias(id)
);

ALTER TABLE tareas 
ADD COLUMN codigo_base TEXT COMMENT 'Código base/plantilla para el ejercicio',
ADD COLUMN resultado_esperado TEXT COMMENT 'Resultado esperado que debe mostrar el código al ejecutarse';

ALTER TABLE tareas 
ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Título descriptivo del ejercicio';

