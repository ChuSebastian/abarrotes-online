// generar-token.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = "clave-super-segura";
const tenant_id = "cliente001"; 

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

