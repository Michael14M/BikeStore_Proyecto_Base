const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const productosRoutes = require("./routes/productos.routes");
const carritoRoutes = require("./routes/carrito.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const adminPedidosRoutes = require("./routes/admin.pedidos.routes");
const adminUsuariosRoutes = require("./routes/admin.usuarios.routes");
const adminDashboardRoutes = require("./routes/admin.dashboard.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// CORS abierto (refleja cualquier origen, sin credentials) — correcto para
// desarrollo local: el frontend de Bike Store corre en otro puerto (Vite,
// normalmente 5173) y no se usan cookies de sesión, solo JWT en el header
// Authorization, así que no hace falta restringir origin ni habilitar
// credentials. Si en producción se sirve desde un dominio fijo, restringir
// aquí con `cors({ origin: 'https://tu-dominio' })`.
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Bike Store API funcional" });
});

app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/admin/pedidos", adminPedidosRoutes);
app.use("/api/admin/usuarios", adminUsuariosRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
});

app.use(errorHandler);

module.exports = app;
