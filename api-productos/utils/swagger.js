const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Productos",
      version: "1.0.0",
      description: "Documentación de la API de Productos",
    },
    components: {
      schemas: {
        Producto: {
          type: "object",
          properties: {
            tenant_id: { type: "string" },
            usuario_id: { type: "string" },
            codigo: { type: "string" },
            nombre: { type: "string" },
            precio: { type: "number" },
            stock: { type: "integer" },
            fecha_creacion: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/productos": {
        post: {
          summary: "Crear un producto",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Producto" },
              },
            },
          },
          responses: {
            201: { description: "Producto creado" },
          },
        },
        get: {
          summary: "Listar todos los productos",
          parameters: [
            {
              name: "tenant_id",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Lista de productos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      Items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Producto" },
                      },
                    },
                  },
                },
              },
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
            {
              name: "tenant_id",
              in: "query",
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
          },
        },
        put: {
          summary: "Modificar un producto",
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
            200: { description: "Producto actualizado" },
          },
        },
        delete: {
          summary: "Eliminar un producto",
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
                schema: {
                  type: "object",
                  required: ["tenant_id", "usuario_id"],
                  properties: {
                    tenant_id: { type: "string" },
                    usuario_id: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Producto eliminado" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};

