# BIKE STORE — Proyecto integrado (avance de Fase 3)

Este paquete contiene el frontend real React + TypeScript + Vite y el backend Express + MySQL. Se conserva el diseño de BIKE STORE. El backend es la fuente de verdad para productos, usuarios, carrito, pedidos y administración.

## Requisitos

- Node.js 20.19+ recomendado (Vite 8).
- MySQL 8.0.46 (o una versión compatible con el esquema).

## 1. Crear la base de datos

En MySQL Workbench, abre y ejecuta primero `sql/bike_store_schema.sql` y después `sql/bike_store_seed_productos.sql`. El segundo archivo carga los 32 productos de ejemplo. Si ya tienes datos importantes, haz copia de seguridad antes de volver a ejecutar scripts de inicialización.

## 2. Configurar y arrancar el backend

Abre una terminal en `Backend/`:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Edita `Backend/.env` y configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, un `JWT_SECRET` largo y privado, y las credenciales del administrador inicial (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). No compartas ni subas ese `.env`.

Comprueba `http://localhost:3000/api/health`. Si cambias `PORT`, usa ese puerto también en el frontend.

## 3. Configurar y arrancar el frontend

En otra terminal, entra a `Frontend/`:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Por defecto, `Frontend/.env.example` configura `VITE_API_URL=http://localhost:3000/api`. Si el backend usa otro puerto, actualiza `Frontend/.env` y reinicia Vite.

Vite conserva el puerto `8443` configurado en este proyecto. Abre la URL que muestre la terminal.

## 4. Pruebas estáticas disponibles

Desde `Backend/` ejecuta:

```bash
npm run test:phase3
```

Estas son pruebas de contratos/estructura del código y de la corrección del orden del catálogo; **no sustituyen** las pruebas reales de HTTP, navegador y MySQL. Consulta `FASE3_VERIFICACION.md` para conocer exactamente qué se pudo comprobar al preparar este ZIP.

## Límites conocidos de este avance

- La recuperación de contraseña usa un token de desarrollo mientras no se configure un proveedor de correo.
- El checkout registra el pedido y el método de pago elegido, pero no procesa pagos reales con una pasarela.
- No se debe considerar esta versión validada para producción hasta ejecutar las pruebas de extremo a extremo en el entorno local con MySQL.
