const jwt = require('jsonwebtoken');
const env = require('../config/env');

// A diferencia de authenticate() (que exige el token), este middleware es
// para rutas públicas (como GET /api/productos) que de todas formas quieren
// saber si quien pregunta es un admin logueado, para variar la respuesta
// (ej: incluir productos inactivos). Si no hay token, o es inválido, sigue
// sin bloquear la petición — simplemente req.user queda undefined.
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer')) {
    const token = header.substring(7);
    try {
      req.user = jwt.verify(token, env.jwt.secret);
    } catch {
      // token inválido/expirado: se ignora, la ruta sigue siendo pública
    }
  }
  next();
}

module.exports = optionalAuthenticate;
