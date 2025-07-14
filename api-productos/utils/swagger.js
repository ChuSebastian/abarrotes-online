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
          summary: "Crear un producto (solo admin)",
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
            403: { description: "No autorizado" },
          },
        },
        get: {
          summary: "Listar todos los productos (visibles para todos)",
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
          summary: "Buscar producto por código (acceso público)",
          parameters: [
            { name: "codigo", in: "path", required: true, schema: { type: "string" } },
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
          summary: "Modificar un producto (solo admin)",
          parameters: [{ name: "codigo", in: "path", required: true, schema: { type: "string" } }],
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
            403: { description: "No autorizado" },
          },
        },
        delete: {
          summary: "Eliminar un producto (solo admin)",
          parameters: [{ name: "codigo", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tenant_id"],
                  properties: {
                    tenant_id: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Producto eliminado" },
            403: { description: "No autorizado" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi: require("swagger-ui-express"),
};

