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
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/productos": {
      get: {
        summary: "Listar todos los productos",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de productos" },
          500: { description: "Error interno" },
        },
      },
      post: {
        summary: "Crear un nuevo producto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  codigo: { type: "string" },
                  nombre: { type: "string" },
                  descripcion: { type: "string" },
                  precio_unitario: { type: "number" },
                  stock: { type: "integer" },
                },
                required: ["codigo", "nombre", "precio_unitario", "stock"],
              },
            },
          },
        },
        responses: {
          201: { description: "Producto creado" },
          400: { description: "Error de validación" },
          500: { description: "Error interno" },
        },
      },
    },
    "/productos/{codigo}": {
      get: {
        summary: "Buscar producto por código",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Producto encontrado" },
          404: { description: "Producto no encontrado" },
        },
      },
      put: {
        summary: "Modificar un producto",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  descripcion: { type: "string" },
                  precio_unitario: { type: "number" },
                  stock: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Producto actualizado" },
          404: { description: "Producto no encontrado" },
        },
      },
      delete: {
        summary: "Eliminar un producto",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "codigo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Producto eliminado" },
          404: { description: "Producto no encontrado" },
        },
      },
    },
  },
};

module.exports = { swaggerUi, swaggerSpec };

