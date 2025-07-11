// generar-token.js
const jwt = require("jsonwebtoken");

// Cambia esto por tu valor real
const JWT_SECRET = "clave-super-segura";
const tenant_id = "cliente001"; // puede ser correo o cualquier string

// Opcional: puedes agregar más datos al payload si quieres
const payload = {
  tenant_id,
  // otros campos opcionales
  // email: "cliente001@correo.com",
  // rol: "admin"
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

console.log("Token generado:");
console.log(token);

