const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Compras",
    version: "1.0.0",
    description: "Documentación de la API de compras",
  },
  paths: {
    "/compras": {
      get: {
        summary: "Obtener compras por tenant",
        responses: {
          200: {
            description: "Lista de compras",
          },
        },
      },
      post: {
        summary: "Registrar una compra",
        responses: {
          201: {
            description: "Compra creada",
          },
          400: {
            description: "Error de stock",
          },
          404: {
            description: "Producto no encontrado",
          },
        },
      },
    },
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
};

