const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API Productos",
    version: "1.0.0",
    description: "Documentación de la API de productos",
  },
  paths: {
    "/productos": {
      get: {
        summary: "Listar productos",
        responses: {
          200: {
            description: "Lista de productos",
          },
        },
      },
      post: {
        summary: "Crear producto",
        responses: {
          201: {
            description: "Producto creado",
          },
        },
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
        responses: {
          200: { description: "Modificado" },
        },
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
      },
    },
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
};

