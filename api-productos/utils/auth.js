const jwt = require("jsonwebtoken");

const validarToken = (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token faltante o mal formado");
  }

  const token = authHeader.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET); // asegúrate de tener la secret

  return payload.tenant_id; // <-- tu token debe incluir tenant_id al crearlo
};

module.exports = { validarToken };

