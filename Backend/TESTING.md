# Pruebas de la API — Fase 2

75 casos probados manualmente con `curl` contra una base de datos MySQL real (no simulada), levantando el servidor con `npm run dev`. Se muestran ejemplos reales de request/response. Base URL en los ejemplos: `http://localhost:3000/api` (ajusta el puerto a tu `.env`).

En Thunder Client / Postman: crea una colección, agrega estas mismas requests, y guarda el `token` de login en una variable de entorno para reutilizarlo en el header `Authorization: Bearer {{token}}`.

---

## 1. AUTH

**Registro — éxito**
```http
POST /api/auth/register
Content-Type: application/json

{ "nombre": "Juan Cliente", "email": "juan@correo.com", "password": "123456" }
```
```json
201 { "ok": true, "message": "usuario registrado", "id_usuario": 9 }
```

**Login — éxito**
```http
POST /api/auth/login
{ "email": "juan@correo.com", "password": "123456" }
```
```json
200 { "ok": true, "user": { "id_usuario": 9, "nombre": "Juan Cliente", "email": "juan@correo.com", "rol": "cliente", "activo": 1 }, "token": "eyJhbGciOi..." }
```
`password_hash` **nunca** aparece en la respuesta (verificado).

**❌ Login con contraseña incorrecta**
```json
401 { "ok": false, "message": "Credenciales incorrectas" }
```

**❌ Login de usuario inactivo**
```json
403 { "ok": false, "message": "Esta cuenta está desactivada. Contacta a un administrador." }
```

**GET /api/auth/me — con JWT válido**
```json
200 { "ok": true, "user": { "id_usuario": 9, "nombre": "Juan Cliente", "email": "juan@correo.com", "rol": "cliente", "activo": 1, "creado_en": "..." } }
```

**❌ GET /api/auth/me sin token**
```json
401 { "ok": false, "message": "Token no proporcionado" }
```

**❌ JWT inválido/manipulado**
```http
Authorization: Bearer token.invalido.123
```
```json
401 { "ok": false, "message": "Token inválido o expirado" }
```

---

## 2. PRODUCTOS

**GET /api/productos — catálogo público** → `200 { ok, total: 32, productos: [...] }` (solo `activo=1`)

**GET /api/productos?categoria=mtb** → filtra correctamente por categoría.

**GET /api/productos?search=canyon** → búsqueda por nombre/marca.

**❌ Cliente intenta crear producto**
```json
403 { "ok": false, "message": "No tienes permisos para realizar esta operacion" }
```

**Admin crea producto — éxito**
```http
POST /api/productos
Authorization: Bearer {{token_admin}}
{ "nombre": "Bici de Prueba", "marca": "TestBrand", "categoria": "mtb", "precio": 500000, "descripcion": "...", "stock": 10 }
```
```json
201 { "ok": true, "producto": { "id_producto": 34, "slug": "bici-de-prueba", ... } }
```

**❌ Precio inválido (0)** → `400 { "message": "precio debe ser mayor a 0" }`
**❌ Categoría inválida** → `400 { "message": "categoria inválida..." }`
**❌ Slug duplicado** → `409 { "message": "Ya existe un producto con ese slug" }`

**Admin desactiva (`activo:false`)** → el producto deja de aparecer en `GET /api/productos` público, pero sigue visible con `?incluirInactivos=true` + token admin.

**❌ GET producto inexistente** → `404 { "message": "Producto no encontrado" }`
**❌ GET con id no numérico (`/api/productos/abc`)** → `400`, nunca `500`.

**❌ DELETE producto con pedidos asociados (RESTRICT real de MySQL)**
```json
409 { "ok": false, "message": "No se puede eliminar: el producto tiene carritos o pedidos asociados. Desactívalo en su lugar (activo = 0)." }
```
**DELETE producto sin relaciones** → `200 { "message": "Producto eliminado" }`

**Subida de imagen — admin, archivo válido** → `200`, `producto.imagen` apunta a `/uploads/productos/<archivo>.png`, y el archivo queda guardado en disco (verificado).
**❌ Cliente sube imagen** → `403`.
**❌ Archivo no-imagen (.txt)** → `400 { "message": "Formato de imagen no permitido (solo jpg, png o webp)" }`.
**❌ Sin archivo adjunto** → `400 { "message": "Debes enviar un archivo en el campo \"imagen\"" }`.

---

## 3. CARRITO

**GET /api/carrito (vacío)** → `200 { "carrito": { "items": [], "cantidadTotal": 0, "total": 0 } }`

**❌ Agregar producto inexistente** → `404 { "message": "Producto no encontrado" }`

**🔒 PRECIO MANIPULADO desde el cliente**
```http
POST /api/carrito/items
{ "id_producto": 34, "cantidad": 2, "precio": 1 }
```
El backend **ignora** el `precio: 1` enviado y usa el precio real de la tabla `productos` (verificado: respuesta trae `precio: 500000`, no `1`).

**❌ Stock insuficiente**
```json
409 { "ok": false, "message": "Stock insuficiente para \"Bici de Prueba\". Disponible: 10, solicitado: 999" }
```

**🔒 Aislamiento entre usuarios**: el carrito de un cliente nunca aparece en el `GET /api/carrito` de otro. Un cliente que intenta `PUT`/`DELETE` sobre el `id_carrito_item` de otro usuario recibe `404` (no revela que el ítem existe).

---

## 4. PEDIDOS

**❌ Crear pedido con carrito vacío**
```json
400 { "ok": false, "message": "El carrito está vacío" }
```

**🔒 TOTAL/SUBTOTAL MANIPULADOS desde el cliente**
```http
POST /api/pedidos
{ "direccion": "...", "ciudad": "...", "telefono": "...", "metodo_pago": "tarjeta", "subtotal": 1, "total": 1 }
```
El backend ignora `subtotal`/`total` enviados y los recalcula desde los precios reales de `productos` (verificado: `pedido.subtotal` = valor real, no `1`).

**Pedido exitoso** → descuenta stock real (verificado: 10→8 tras comprar 2), vacía el carrito, crea `detalle_pedido` con snapshot de nombre/imagen/precio.

**❌ PEDIDO SIN STOCK (condición real, con ROLLBACK)**: se agregan 5 unidades al carrito; el admin baja el stock a 2 antes de confirmar; al crear el pedido:
```json
409 { "ok": false, "message": "Stock insuficiente para \"...\". Disponible: 2, solicitado: 5" }
```
Se verificó que el stock **no cambió** (seguía en 2) — la transacción hizo `ROLLBACK` completo, sin descuentos parciales.

**🔒 Un cliente no puede ver el pedido de otro** → `404` (no `403`, para no confirmar su existencia). El dueño del pedido sí puede verlo.

**Admin — listar todos / ver cualquiera / cambiar estado**: funcionan solo con rol `admin` (`403` para `cliente`). Estado inválido (`"NOEXISTE"`) → `400`.

---

## 5. ADMINISTRACIÓN DE USUARIOS

**❌ Cliente llama cualquier `/api/admin/usuarios/*`** → `403` en todos los casos probados.

**Admin lista usuarios** → `password_hash` nunca aparece en la respuesta (verificado programáticamente).

**Admin cambia rol / estado** → funciona correctamente, y se refleja de inmediato (probado ascendiendo a un cliente a admin y devolviéndolo).

**🔒 Autoprotección — admin intenta cambiar su propio rol**
```json
400 { "ok": false, "message": "No puedes cambiar tu propio rol" }
```
Mismo resultado al intentar desactivarse o eliminarse a sí mismo.

**❌ DELETE usuario con pedidos (RESTRICT real)**
```json
409 { "ok": false, "message": "No se puede eliminar: el usuario tiene pedidos asociados. Desactívalo en su lugar (activo = 0)." }
```

---

## 6. RECUPERACIÓN DE CONTRASEÑA

**POST /api/auth/forgot-password** (correo existente)
```json
200 { "ok": true, "message": "Si el correo está registrado...", "debug_token": "89219f20...f3b" }
```
`debug_token` solo aparece con `NODE_ENV=development` — pensado para probar sin proveedor de correo real.

**Correo inexistente** → misma respuesta genérica, **sin** `debug_token` ni indicio de que no existe (previene enumeración de usuarios).

**❌ Token inválido** → `400 { "message": "Token inválido" }`

**Reset con token válido** → `200`, contraseña actualizada; login con la contraseña vieja falla (`401`), login con la nueva funciona.

**❌ Reutilizar el mismo token** → `400 { "message": "Este token ya fue utilizado" }`

**❌ Token expirado** (se forzó `expira_en` al pasado en la BD) → `400 { "message": "El token ha expirado. Solicita uno nuevo." }`, y se verificó que la contraseña **no** cambió.

---

## 7. DASHBOARD

**❌ Cliente** → `403`.

**Admin** — ejemplo real de respuesta:
```json
{
  "ok": true,
  "productos": { "total_productos": 33, "productos_activos": 33, "productos_sin_stock": 0, "productos_stock_bajo": 13 },
  "usuarios": { "total_usuarios": 3, "total_clientes": 2, "total_admins": 1 },
  "pedidos": { "total_pedidos": 1, "ventas_totales": 1000000, "pedidos_completados": 1 },
  "pedidos_recientes": [ { "numero_pedido": "BS-2026-54322", "total": 1000000, "cliente_nombre": "Cliente Uno" } ],
  "top_productos": [ { "nombre_producto": "Bici de Prueba", "unidades_vendidas": 2, "ingresos": 1000000 } ],
  "productos_stock_bajo": [ { "slug": "pinarello-dogma", "nombre": "Pinarello Dogma F", "stock": 1 }, ... ]
}
```
Todos los números salen de `COUNT`/`SUM`/`GROUP BY` reales sobre MySQL — ninguno está hardcodeado (verificado comparando contra los datos insertados en las pruebas anteriores).

---

## Resumen

75/75 casos pasaron, incluyendo los 13 casos de error que pedía la Fase 2 explícitamente (login incorrecto, JWT inválido, cliente en endpoint admin, producto inexistente, stock insuficiente, carrito vacío, pedido sin stock con rollback, acceso cruzado entre usuarios, precio manipulado, total manipulado, usuario inactivo, token expirado, token reutilizado) más validaciones adicionales (slug duplicado, categoría inválida, id no numérico, tipo de archivo inválido, autoprotección de administradores).
