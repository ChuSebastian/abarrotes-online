// utils/swagger.js
const express = require("express");
const serverless = require("serverless-http");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Productos",
    version: "1.0.0",
    description: "Documentación de la API de productos",
  },
  servers: [
    {
      url: "https://wx8ctj21p4.execute-api.us-east-1.amazonaws.com/dev",
      description: "API Gateway - Entorno dev",
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
    schemas: {
      Producto: {
        type: "object",
        required: ["codigo", "nombre", "precio", "stock"],
        properties: {
          codigo: { type: "string", example: "prod-001" },
          nombre: { type: "string", example: "Camiseta Blanca" },
          precio: { type: "number", example: 29.99 },
          stock: { type: "integer", example: 100 },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/productos": {
      get: {
        summary: "Listar productos",
        responses: {
          200: {
            description: "Lista de productos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Producto" },
                },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: "Crear producto",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Producto" },
            },
          },
        },
        responses: {
          201: {
            description: "Producto creado",
          },
          400: {
            description: "Error en la solicitud",
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    "/productos/{codigo}": {
      get: {
        summary: "Buscar producto por código",
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Producto encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Producto" },
              },
            },
          },
          404: {
            description: "Producto no encontrado",
          },
        },
        security: [{ bearerAuth: [] }],
      },
      put: {
        summary: "Modificar producto",
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Producto" },
            },
          },
        },
        responses: {
          200: { description: "Producto modificado" },
          400: { description: "Error en la solicitud" },
        },
        security: [{ bearerAuth: [] }],
      },
      delete: {
        summary: "Eliminar producto",
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Producto eliminado" },
          404: { description: "Producto no encontrado" },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
};

// Crear app Express y exponer /docs
const app = express();
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const handler = serverless(app);

module.exports = {
  handler, // este es el handler que se usará en serverless.yml
};

