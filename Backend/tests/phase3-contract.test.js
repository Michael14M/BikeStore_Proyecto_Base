const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('el catálogo usa un orden determinista compatible con el seed original', () => {
  const source = read('Backend/src/services/productos.service.js');
  assert.match(source, /ORDER BY id_producto ASC/);
  assert.doesNotMatch(source, /ORDER BY creado_en DESC/);
});

test('el frontend conserva separado el slug visual y el ID numérico de MySQL', () => {
  const service = read('Frontend/src/services/productService.ts');
  assert.match(service, /id:\s*p\.slug/);
  assert.match(service, /idProducto:\s*p\.id_producto/);
});

test('el carrito autenticado envía el ID numérico, no el slug visual', () => {
  const hook = read('Frontend/src/store/useCart.ts');
  const service = read('Frontend/src/services/cartService.ts');
  assert.match(hook, /cartService\.addCartItem\(product\.idProducto as number, 1\)/);
  assert.match(service, /body:\s*\{\s*id_producto:\s*idProducto,\s*cantidad\s*\}/);
});

test('el checkout envía datos de entrega y método de pago, no importes manipulables', () => {
  const service = read('Frontend/src/services/orderService.ts');
  const payload = service.match(/body:\s*\{([\s\S]*?)\},\s*\n\s*\}\)\.then/);
  assert.ok(payload, 'debe existir el cuerpo de POST /pedidos');
  assert.match(payload[1], /direccion:/);
  assert.match(payload[1], /ciudad:/);
  assert.match(payload[1], /telefono:/);
  assert.match(payload[1], /metodo_pago:/);
  assert.doesNotMatch(payload[1], /subtotal|total|precio|stock|envio/);
});

test('la API declara rutas para auth, catálogo, carrito, pedidos y administración', () => {
  const app = read('Backend/src/app.js');
  for (const route of [
    'app.use("/api/auth", authRoutes)',
    'app.use("/api/productos", productosRoutes)',
    'app.use("/api/carrito", carritoRoutes)',
    'app.use("/api/pedidos", pedidosRoutes)',
    'app.use("/api/admin/pedidos", adminPedidosRoutes)',
    'app.use("/api/admin/usuarios", adminUsuariosRoutes)',
    'app.use("/api/admin/dashboard", adminDashboardRoutes)',
  ]) assert.ok(app.includes(route), `falta montaje de ruta: ${route}`);
});
