-- =====================================================================
-- BIKE STORE — Esquema de base de datos (Fase 1)
-- Motor objetivo: MySQL 8.0.46 (InnoDB, utf8mb4)
--
-- Reemplaza a sql/lab_crud.sql de la plantilla original. La entidad demo
-- "equipos" no se conserva: el dominio real es usuarios, productos,
-- carritos, pedidos y recuperación de contraseña.
--
-- Orden de creación respeta las dependencias de claves foráneas:
--   usuarios -> productos -> carritos -> carrito_items
--            -> pedidos -> detalle_pedido -> tokens_recuperacion
--
-- Eliminación lógica: usuarios y productos NUNCA se borran con DELETE;
-- se desactivan con activo = 0. Por eso sus FKs salientes usan RESTRICT
-- (o CASCADE solo cuando el hijo no tiene sentido sin el padre, como el
-- carrito).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS bike_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bike_store;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  rol             ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_rol_activo (rol, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. productos
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id_producto      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(100) NOT NULL,
  nombre           VARCHAR(150) NOT NULL,
  marca            VARCHAR(80)  NOT NULL,
  categoria        ENUM('mtb', 'ruta', 'urbana', 'electrica', 'accesorios') NOT NULL,
  precio           DECIMAL(12,2) NOT NULL,
  precio_anterior  DECIMAL(12,2) NULL,
  imagen           VARCHAR(500) NULL,
  rating           DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  descripcion      TEXT NOT NULL,
  stock            INT UNSIGNED NOT NULL DEFAULT 0,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_producto),
  UNIQUE KEY uq_productos_slug (slug),
  KEY idx_productos_categoria_activo (categoria, activo),
  KEY idx_productos_activo (activo),
  FULLTEXT KEY ft_productos_nombre_marca (nombre, marca),
  CONSTRAINT chk_productos_precio CHECK (precio > 0),
  CONSTRAINT chk_productos_precio_anterior
    CHECK (precio_anterior IS NULL OR precio_anterior > precio),
  CONSTRAINT chk_productos_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT chk_productos_stock CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. carritos — un carrito persistente por usuario
-- ---------------------------------------------------------------------
CREATE TABLE carritos (
  id_carrito      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario      INT UNSIGNED NOT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_carrito),
  UNIQUE KEY uq_carritos_usuario (id_usuario),
  CONSTRAINT fk_carritos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. carrito_items
-- ---------------------------------------------------------------------
CREATE TABLE carrito_items (
  id_carrito_item  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_carrito       INT UNSIGNED NOT NULL,
  id_producto      INT UNSIGNED NOT NULL,
  cantidad         INT UNSIGNED NOT NULL DEFAULT 1,
  agregado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_carrito_item),
  UNIQUE KEY uq_carrito_items_carrito_producto (id_carrito, id_producto),
  KEY idx_carrito_items_producto (id_producto),
  CONSTRAINT fk_carrito_items_carrito
    FOREIGN KEY (id_carrito) REFERENCES carritos (id_carrito)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- RESTRICT (no CASCADE): un producto no se puede borrar físicamente
  -- mientras siga referenciado en algún carrito; primero se desactiva
  -- (productos.activo = 0), nunca se hace DELETE de productos.
  CONSTRAINT fk_carrito_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_carrito_items_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. pedidos
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id_pedido       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero_pedido   VARCHAR(20) NOT NULL,
  id_usuario      INT UNSIGNED NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  envio           DECIMAL(12,2) NOT NULL DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL,
  metodo_pago     ENUM('tarjeta', 'pse', 'efectivo') NOT NULL,
  direccion       VARCHAR(255) NOT NULL,
  ciudad          VARCHAR(100) NOT NULL,
  telefono        VARCHAR(30) NOT NULL,
  estado          ENUM('pendiente', 'procesando', 'completado', 'cancelado')
                    NOT NULL DEFAULT 'pendiente',
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pedido),
  UNIQUE KEY uq_pedidos_numero (numero_pedido),
  KEY idx_pedidos_usuario_fecha (id_usuario, fecha),
  KEY idx_pedidos_estado_fecha (estado, fecha),
  KEY idx_pedidos_fecha (fecha),
  -- RESTRICT: el historial de ventas no puede perderse; un usuario con
  -- pedidos se desactiva (usuarios.activo = 0), nunca se borra.
  CONSTRAINT fk_pedidos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_pedidos_montos
    CHECK (subtotal >= 0 AND envio >= 0 AND total >= 0),
  CONSTRAINT chk_pedidos_total CHECK (total = subtotal + envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. detalle_pedido — snapshot del producto al momento de la compra
-- ---------------------------------------------------------------------
CREATE TABLE detalle_pedido (
  id_detalle        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pedido         INT UNSIGNED NOT NULL,
  id_producto       INT UNSIGNED NOT NULL,
  nombre_producto   VARCHAR(150) NOT NULL,
  imagen_producto   VARCHAR(500) NULL,
  precio_unitario   DECIMAL(12,2) NOT NULL,
  cantidad          INT UNSIGNED NOT NULL,
  subtotal_linea    DECIMAL(14,2)
                      GENERATED ALWAYS AS (precio_unitario * cantidad) STORED,
  PRIMARY KEY (id_detalle),
  UNIQUE KEY uq_detalle_pedido_producto (id_pedido, id_producto),
  KEY idx_detalle_producto (id_producto),
  CONSTRAINT fk_detalle_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- RESTRICT: conserva la trazabilidad de ventas de cada producto.
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. tokens_recuperacion — recuperación de contraseña (RF-16)
-- ---------------------------------------------------------------------
CREATE TABLE tokens_recuperacion (
  id_token    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario  INT UNSIGNED NOT NULL,
  -- Se guarda el HASH (SHA-256) del token, nunca el token en claro.
  token_hash  CHAR(64) NOT NULL,
  expira_en   DATETIME NOT NULL,
  usado_en    DATETIME NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_token),
  UNIQUE KEY uq_tokens_hash (token_hash),
  KEY idx_tokens_usuario (id_usuario),
  KEY idx_tokens_expira (expira_en),
  CONSTRAINT fk_tokens_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
