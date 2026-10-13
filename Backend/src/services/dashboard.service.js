const pool = require('../config/db');

// Todas las métricas se calculan con agregaciones SQL reales (COUNT/SUM/GROUP
// BY) sobre las tablas de la Fase 1 — nada hardcodeado (punto 8 de la Fase 2).
async function getDashboard() {
  const [[productosStats]] = await pool.query(`
    SELECT
      COUNT(*)                                        AS total_productos,
      COALESCE(SUM(activo = 1), 0)                     AS productos_activos,
      COALESCE(SUM(activo = 0), 0)                     AS productos_inactivos,
      COALESCE(SUM(activo = 1 AND stock = 0), 0)       AS productos_sin_stock,
      COALESCE(SUM(activo = 1 AND stock BETWEEN 1 AND 5), 0) AS productos_stock_bajo
    FROM productos
  `);

  const [[usuariosStats]] = await pool.query(`
    SELECT
      COUNT(*)                         AS total_usuarios,
      COALESCE(SUM(rol = 'cliente'), 0) AS total_clientes,
      COALESCE(SUM(rol = 'admin'), 0)   AS total_admins,
      COALESCE(SUM(activo = 1), 0)      AS usuarios_activos,
      COALESCE(SUM(activo = 0), 0)      AS usuarios_inactivos
    FROM usuarios
  `);

  const [[pedidosStats]] = await pool.query(`
    SELECT
      COUNT(*)                              AS total_pedidos,
      COALESCE(SUM(total), 0)               AS ventas_totales,
      COALESCE(SUM(estado = 'pendiente'), 0)   AS pedidos_pendientes,
      COALESCE(SUM(estado = 'procesando'), 0)  AS pedidos_procesando,
      COALESCE(SUM(estado = 'completado'), 0)  AS pedidos_completados,
      COALESCE(SUM(estado = 'cancelado'), 0)   AS pedidos_cancelados
    FROM pedidos
  `);

  const [pedidosRecientes] = await pool.query(`
    SELECT p.id_pedido, p.numero_pedido, p.total, p.estado, p.fecha,
           u.nombre AS cliente_nombre, u.email AS cliente_email
    FROM pedidos p
    JOIN usuarios u ON u.id_usuario = p.id_usuario
    ORDER BY p.fecha DESC
    LIMIT 5
  `);

  const [topProductos] = await pool.query(`
    SELECT dp.id_producto, dp.nombre_producto,
           SUM(dp.cantidad)        AS unidades_vendidas,
           SUM(dp.subtotal_linea)  AS ingresos
    FROM detalle_pedido dp
    GROUP BY dp.id_producto, dp.nombre_producto
    ORDER BY unidades_vendidas DESC
    LIMIT 5
  `);

  const [productosStockBajo] = await pool.query(`
    SELECT id_producto, slug, nombre, stock
    FROM productos
    WHERE activo = 1 AND stock <= 5
    ORDER BY stock ASC
    LIMIT 10
  `);

  return {
    productos: productosStats,
    usuarios: usuariosStats,
    pedidos: pedidosStats,
    pedidos_recientes: pedidosRecientes,
    top_productos: topProductos,
    productos_stock_bajo: productosStockBajo,
  };
}

module.exports = { getDashboard };
