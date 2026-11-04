-- Migración incremental BIKE STORE: lista de deseos.
-- Ejecutar una sola vez sobre la base bike_store existente.
CREATE TABLE IF NOT EXISTS lista_deseos (
  id_usuario INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_producto),
  KEY idx_lista_deseos_producto (id_producto),
  CONSTRAINT fk_lista_deseos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_lista_deseos_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
