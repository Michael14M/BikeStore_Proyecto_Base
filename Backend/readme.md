# Bike Store – Backend

API REST de Bike Store: Express 5, MySQL (`mysql2/promise`, sin ORM), bcrypt, JWT y roles `admin` / `cliente`.

Construido sobre la plantilla de laboratorio original (`lab-crud`): se conservan `authenticate()`, `authorize()`, bcrypt y JWT; se retiró la entidad demo `equipos` y se reemplazó por el dominio real de Bike Store (productos, carrito, pedidos, detalle de pedido, recuperación de contraseña).

**Estado: Fases 1 y 2 implementadas. Fase 3: el frontend real de BIKE STORE ya contiene servicios para consumir esta API; consulta `../FASE3_VERIFICACION.md` para distinguir las comprobaciones estáticas de las pruebas de extremo a extremo que aún deben ejecutarse en un entorno con MySQL y dependencias instaladas.**

## 1. Requisitos

- Node.js 18+
- MySQL 8.0.16+ (objetivo: 8.0.46) o MariaDB 10.2.1+ (los `CHECK` constraints y columnas generadas lo requieren)

## 2. Base de datos

Ejecuta, en este orden:

```bash
mysql -u root -p < sql/bike_store_schema.sql
mysql -u root -p bike_store < sql/bike_store_seed_productos.sql   # opcional, 32 productos de ejemplo
```

## 3. Variables de entorno

Copia `.env.example` → `.env` y completa:

| Variable | Descripción |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciales de tu MySQL local |
| `JWT_SECRET` | Cualquier cadena larga y secreta (nunca la subas a git) |
| `JWT_EXPIRES_IN` | Vigencia del token, ej. `2h` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin inicial, creado automáticamente al arrancar si no existe |
| `NODE_ENV` | `development` mientras no haya proveedor de correo (ver sección 8) |

`.env` está en `.gitignore` — nunca se commitea ni se expone por la API.

## 4. Instalar y ejecutar

```bash
npm install
npm run dev
```

API: `http://localhost:3000` (o el `PORT` que configures).

## 5. Estructura

```
src/
├── app.js                      # Express app, CORS, montaje de rutas
├── config/ (db.js, env.js)
├── routes/      → controllers/      → services/      → pool MySQL
│   auth            auth                 auth
│   productos        productos            productos
│   carrito          carrito              carrito
│   pedidos          pedidos              pedidos
│   admin.pedidos    (pedidos)            (pedidos)
│   admin.usuarios   usuarios             usuarios
│   admin.dashboard  dashboard            dashboard
├── middlewares/ (auth, upload, optionalAuth, error)
├── utils/ (jwt, AppError, asyncHandler, validate)
└── startup/seedAdmin.js
```

Separación estricta: las rutas solo conectan middlewares con el controller; los controllers no tienen SQL (usan `asyncHandler` para no repetir try/catch); los services son los únicos que tocan el pool de MySQL, siempre con *prepared statements* (`pool.execute` con `?`).

## 6. Autenticación y roles

Flujo: registro → `bcrypt.hash` → MySQL (`usuarios.password_hash`) → login → `bcrypt.compare` → verifica `activo` → JWT → middleware `authenticate` (valida el token) → `authorize(rol)` (valida el rol).

El JWT viaja como header `Authorization: Bearer <token>` y nunca incluye `password_hash`. Roles: `cliente`, `admin`.

Protecciones de auto-bloqueo en administración de usuarios: un admin no puede cambiarse su propio rol, desactivarse ni eliminarse a sí mismo, ni dejar el sistema sin ningún admin activo.

## 7. Endpoints

### Auth (público salvo `/me`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crea usuario, rol `cliente` fijo |
| POST | `/api/auth/login` | Devuelve `{ user, token }` |
| GET | `/api/auth/me` | Usuario autenticado actual |
| POST | `/api/auth/forgot-password` | Genera token de recuperación (ver nota de correo abajo) |
| POST | `/api/auth/reset-password` | Cambia la contraseña con un token válido, no usado y no expirado |

### Productos
| Método | Ruta | Protección |
|---|---|---|
| GET | `/api/productos` `?categoria=&search=&incluirInactivos=` | Público (admin logueado puede pedir inactivos) |
| GET | `/api/productos/:id` | Público |
| POST | `/api/productos` | admin |
| PUT | `/api/productos/:id` | admin |
| DELETE | `/api/productos/:id` | admin (bloqueado por `RESTRICT` si tiene carritos/pedidos) |
| POST | `/api/productos/:id/imagen` | admin (multer, campo `imagen`, jpg/png/webp, máx. 2MB) |

### Carrito (siempre del usuario autenticado — nunca por id enviado por el cliente)
| Método | Ruta |
|---|---|
| GET | `/api/carrito` |
| POST | `/api/carrito/items` |
| PUT | `/api/carrito/items/:id` |
| DELETE | `/api/carrito/items/:id` |
| DELETE | `/api/carrito` |

### Pedidos
| Método | Ruta | Protección |
|---|---|---|
| POST | `/api/pedidos` | cliente/admin — crea pedido desde el carrito del usuario autenticado, en una transacción |
| GET | `/api/pedidos` | Lista los pedidos del usuario autenticado |
| GET | `/api/pedidos/:id` | Un pedido propio (admin puede ver cualquiera) |
| GET | `/api/admin/pedidos` | admin — todos los pedidos |
| GET | `/api/admin/pedidos/:id` | admin — cualquier pedido |
| PUT | `/api/admin/pedidos/:id/estado` | admin — cambia `estado` |

### Administración de usuarios (todo admin-only)
| Método | Ruta |
|---|---|
| GET | `/api/admin/usuarios` `?search=&rol=` |
| GET | `/api/admin/usuarios/:id` |
| PUT | `/api/admin/usuarios/:id` (nombre/email) |
| PUT | `/api/admin/usuarios/:id/rol` |
| PUT | `/api/admin/usuarios/:id/estado` |
| DELETE | `/api/admin/usuarios/:id` (bloqueado por `RESTRICT` si el usuario tiene pedidos) |

### Dashboard
| Método | Ruta |
|---|---|
| GET | `/api/admin/dashboard` — productos, usuarios, pedidos, ventas totales, top productos, stock bajo, todo calculado con SQL real |

Ver **TESTING.md** para ejemplos completos de request/response de cada endpoint, y de cada caso de error.

## 8. Recuperación de contraseña — nota importante

No hay proveedor de correo configurado todavía. `POST /api/auth/forgot-password` genera el token, lo guarda **hasheado** (SHA-256) en `tokens_recuperacion` con expiración de 30 minutos, y:
- lo imprime en la consola del servidor, y
- lo devuelve en la respuesta como `debug_token` **solo si `NODE_ENV !== 'production'`**.

El punto exacto donde conectar un proveedor real (Nodemailer+SMTP, SendGrid, Resend, etc.) está marcado con un comentario `PUNTO DE INTEGRACIÓN FUTURA` en `src/services/auth.service.js`, dentro de `forgotPassword()`.

## 9. Seguridad — qué se garantiza en esta fase

- Contraseñas con bcrypt (nunca texto plano ni en respuestas JSON).
- JWT validado en servidor (`authenticate`) + rol validado en servidor (`authorize`) — no son checks de solo-frontend.
- Todo SQL usa `pool.execute(sql, params)` con `?` — sin concatenar strings (previene inyección SQL).
- Precio, subtotal, total y stock **siempre** se calculan/leen desde MySQL — cualquier valor enviado por el cliente para esos campos se ignora.
- `id_usuario` de carrito/pedidos siempre sale de `req.user` (del JWT), nunca de `req.body`/`req.params`.
- Un cliente no puede leer ni modificar carrito/pedidos de otro usuario (404, no 403, para no confirmar que el recurso existe).
- `DELETE` de usuarios/productos respeta el `ON DELETE RESTRICT` de la Fase 1 — se recomienda desactivar (`activo=0`) en vez de borrar.
- CORS abierto intencionalmente (ver comentario en `app.js`) — correcto para desarrollo local sin cookies de sesión.
- `.env` nunca se expone ni se commitea.

## 10. Pruebas

Ver **TESTING.md** — incluye los 75 casos probados manualmente contra una base de datos real (éxitos y errores: login incorrecto, JWT inválido, cliente llamando endpoints admin, producto inexistente, stock insuficiente, carrito vacío, pedido sin stock con rollback real, acceso cruzado entre usuarios, precio/total manipulado, usuario inactivo, token de recuperación expirado y reutilizado, etc.) con el request y la response real de cada uno.
