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
    paths: {
      "/compras": {
        get: {
          summary: "Obtener historial de compras del usuario",
          parameters: [
            {
              name: "tenant_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "usuario_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": { description: "Lista de compras del usuario" },
            "400": { description: "Faltan parámetros" },
            "500": { description: "Error interno" },
          },
        },
        post: {
          summary: "Registrar una compra",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tenant_id: { type: "string" },
                    usuario_id: { type: "string" },
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
                  required: ["tenant_id", "usuario_id", "productos"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Compra creada" },
            "400": { description: "Stock insuficiente o datos inválidos" },
            "403": { description: "No permitido para este tenant" },
            "404": { description: "Producto no encontrado" },
            "500": { description: "Error interno" },
          },
        },
      },
    },
  };
}

module.exports = { swaggerUi, getSwaggerSpec };

