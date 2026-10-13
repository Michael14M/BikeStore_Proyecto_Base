// Envuelve un controller async para que cualquier error (incluyendo errores
// de promesas no capturadas) llegue a next() y termine en errorHandler,
// sin tener que repetir try/catch en cada función de cada controller.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
