const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Compras",
    version: "1.0.0",
    description: "Documentación de la API de compras",
  },
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
        summary: "Obtener compras por tenant",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: "Lista de compras",
          },
          500: {
            description: "Error interno del servidor",
          },
        },
      },
      post: {
        summary: "Registrar una compra",
        security: [
          {
            bearerAuth: [],
          },
        ],
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
                },
                required: ["productos"],
              },
            },
          },
        },
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
          500: {
            description: "Error interno del servidor",
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

