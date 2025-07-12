const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Productos",
    version: "1.0.0",
    description: "Documentación de la API de productos",
  },
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
          },
          404: {
            description: "No encontrado",
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
          200: { description: "Modificado" },
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
          204: { description: "Eliminado" },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
};

