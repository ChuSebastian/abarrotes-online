const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Compras",
      version: "1.0.0",
      description: "Documentación de la API de compras multi-tenant",
    },
  },
  apis: ["handler.js"], // Documentación por JSDoc en este archivo
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};


