const swaggerUi = require("swagger-ui-express");

function getSwaggerSpec(baseUrl) {
  return {
    openapi: "3.0.0",
    info: {
      title: "API Compras",
      version: "1.0.0",
      description: "Documentación de la API de compras",
    },
    servers: [
      {
        url: baseUrl,
        description: "Dynamic stage base URL",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      "/compras": {
        get: {
          summary: "Obtener historial de compras",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Lista de compras" },
            "500": { description: "Error interno" },
          },
        },
        post: {
          summary: "Registrar una compra",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    productos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          producto_id: { type: "string" },
                          cantidad: { type: "integer" },
                        },
                        required: ["producto_id", "cantidad"],
                      },
                    },
                    total: { type: "number" },
                  },
                  required: ["productos", "total"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Compra creada" },
            "400": { description: "Stock insuficiente" },
            "404": { description: "Producto no encontrado" },
            "500": { description: "Error interno" },
          },
        },
      },
    },
  };
}

module.exports = { swaggerUi, getSwaggerSpec };

