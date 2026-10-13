const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { requireFields, METODOS_PAGO_VALIDOS, ESTADOS_PEDIDO_VALIDOS } = require('../utils/validate');

// Regla de envío (RF-09/RF-11), alineada con la que muestran el carrito y el
// checkout del frontend de Bike Store: envío gratis desde $500.000; si no, $25.000.
// (Antes eran 300000/15000, valores provisionales que no coincidían con el checkout.)
const ENVIO_GRATIS_DESDE = 500000;
const COSTO_ENVIO = 25000;

function calcularEnvio(subtotal) {
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
}

function generarNumeroPedido() {
  const año = new Date().getFullYear();
  const aleatorio = Math.floor(10000 + Math.random() * 90000);
  return `BS-${año}-${aleatorio}`;
}

async function crearPedido(id_usuario, datos) {
  requireFields(datos, ['direccion', 'ciudad', 'telefono', 'metodo_pago']);
  if (!METODOS_PAGO_VALIDOS.includes(datos.metodo_pago)) {
    throw new AppError(`metodo_pago inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}`, 400);
  }
  // Nunca se guardan datos de tarjeta (seguridad punto 10): solo el método.

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [carritoRows] = await conn.execute(
      'SELECT id_carrito FROM carritos WHERE id_usuario = ? FOR UPDATE',
      [id_usuario]
    );
    if (!carritoRows.length) {
      throw new AppError('El carrito está vacío', 400);
    }
    const id_carrito = carritoRows[0].id_carrito;

    // FOR UPDATE sobre productos: bloquea las filas involucradas hasta el
    // commit/rollback, para que dos pedidos concurrentes no puedan vender
    // el mismo stock dos veces (condición de carrera).
    const [items] = await conn.execute(
      `SELECT ci.id_carrito_item, ci.id_producto, ci.cantidad,
              p.nombre, p.imagen, p.precio, p.stock, p.activo
       FROM carrito_items ci
       JOIN productos p ON p.id_producto = ci.id_producto
       WHERE ci.id_carrito = ?
       FOR UPDATE`,
      [id_carrito]
    );

    if (!items.length) {
      throw new AppError('El carrito está vacío', 400);
    }

    for (const item of items) {
      if (!item.activo) {
        throw new AppError(`"${item.nombre}" ya no está disponible`, 409);
      }
      if (item.cantidad > item.stock) {
        throw new AppError(
          `Stock insuficiente para "${item.nombre}". Disponible: ${item.stock}, en carrito: ${item.cantidad}`,
          409
        );
      }
    }

    const subtotal = items.reduce((acc, it) => acc + Number(it.precio) * it.cantidad, 0);
    const envio = calcularEnvio(subtotal);
    const total = subtotal + envio;

    // Reintenta si el numero_pedido generado colisiona (extremadamente
    // improbable, pero numero_pedido es UNIQUE — mejor manejarlo).
    let numero_pedido;
    let id_pedido;
    for (let intento = 0; intento < 5; intento++) {
      numero_pedido = generarNumeroPedido();
      try {
        const [result] = await conn.execute(
          `INSERT INTO pedidos
            (numero_pedido, id_usuario, subtotal, envio, total, metodo_pago, direccion, ciudad, telefono, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
          [numero_pedido, id_usuario, subtotal, envio, total, datos.metodo_pago, datos.direccion, datos.ciudad, datos.telefono]
        );
        id_pedido = result.insertId;
        break;
      } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY' && intento < 4) continue;
        throw error;
      }
    }

    for (const item of items) {
      await conn.execute(
        `INSERT INTO detalle_pedido
          (id_pedido, id_producto, nombre_producto, imagen_producto, precio_unitario, cantidad)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_pedido, item.id_producto, item.nombre, item.imagen, item.precio, item.cantidad]
      );

      // Descuenta stock con guarda adicional (WHERE stock >= cantidad): si
      // por cualquier motivo no se afecta la fila esperada, se aborta todo.
      const [upd] = await conn.execute(
        'UPDATE productos SET stock = stock - ? WHERE id_producto = ? AND stock >= ?',
        [item.cantidad, item.id_producto, item.cantidad]
      );
      if (upd.affectedRows !== 1) {
        throw new AppError(`No se pudo descontar stock de "${item.nombre}"`, 409);
      }
    }

    await conn.execute('DELETE FROM carrito_items WHERE id_carrito = ?', [id_carrito]);

    await conn.commit();
    return getPedidoById(id_usuario, id_pedido, true);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function getPedidosByUsuario(id_usuario) {
  const [rows] = await pool.execute(
    `SELECT id_pedido, numero_pedido, subtotal, envio, total, metodo_pago, estado, fecha
     FROM pedidos WHERE id_usuario = ? ORDER BY fecha DESC`,
    [id_usuario]
  );
  return rows;
}

async function getTodosPedidos({ estado } = {}) {
  const where = [];
  const params = [];
  if (estado) {
    if (!ESTADOS_PEDIDO_VALIDOS.includes(estado)) {
      throw new AppError(`estado inválido. Debe ser uno de: ${ESTADOS_PEDIDO_VALIDOS.join(', ')}`, 400);
    }
    where.push('p.estado = ?');
    params.push(estado);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT p.id_pedido, p.numero_pedido, p.subtotal, p.envio, p.total, p.metodo_pago, p.estado, p.fecha,
            u.id_usuario, u.nombre AS cliente_nombre, u.email AS cliente_email
     FROM pedidos p
     JOIN usuarios u ON u.id_usuario = p.id_usuario
     ${whereSql}
     ORDER BY p.fecha DESC`,
    params
  );
  return rows;
}

async function getPedidoById(id_usuario, id_pedido, esAdmin) {
  const [pedidoRows] = await pool.execute(
    `SELECT p.*, u.nombre AS cliente_nombre, u.email AS cliente_email
     FROM pedidos p JOIN usuarios u ON u.id_usuario = p.id_usuario
     WHERE p.id_pedido = ?`,
    [id_pedido]
  );
  const pedido = pedidoRows[0];
  if (!pedido) throw new AppError('Pedido no encontrado', 404);
  if (!esAdmin && pedido.id_usuario !== id_usuario) {
    // Mismo criterio que el carrito: no revelar que el pedido existe.
    throw new AppError('Pedido no encontrado', 404);
  }

  const [detalle] = await pool.execute(
    `SELECT id_detalle, id_producto, nombre_producto, imagen_producto, precio_unitario, cantidad, subtotal_linea
     FROM detalle_pedido WHERE id_pedido = ?`,
    [id_pedido]
  );

  return { ...pedido, items: detalle };
}

async function cambiarEstadoPedido(id_pedido, estado) {
  if (!ESTADOS_PEDIDO_VALIDOS.includes(estado)) {
    throw new AppError(`estado inválido. Debe ser uno de: ${ESTADOS_PEDIDO_VALIDOS.join(', ')}`, 400);
  }
  const [result] = await pool.execute(
    'UPDATE pedidos SET estado = ? WHERE id_pedido = ?',
    [estado, id_pedido]
  );
  if (result.affectedRows === 0) throw new AppError('Pedido no encontrado', 404);
  return getPedidoById(null, id_pedido, true);
}

module.exports = {
  crearPedido,
  getPedidosByUsuario,
  getTodosPedidos,
  getPedidoById,
  cambiarEstadoPedido,
};
