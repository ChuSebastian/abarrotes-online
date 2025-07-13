const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Productos",
      version: "1.0.0",
      description: "Documentación de la API de productos multi-tenant",
    },
    components: {
      schemas: {
        Producto: {
          type: "object",
          required: ["codigo", "nombre", "precio", "stock"],
          properties: {
            codigo: { type: "string" },
            nombre: { type: "string" },
            precio: { type: "number" },
            stock: { type: "number" },
            tenant_id: { type: "string" },
            usuario_id: { type: "string" },
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
            400: { description: "Error en la solicitud" },
          },
        },
        get: {
          summary: "Listar productos",
          parameters: [
            {
              name: "limit",
              in: "query",
              description: "Número máximo de productos a retornar",
              schema: { type: "integer" },
            },
            {
              name: "startKey",
              in: "query",
              description: "Clave para paginación",
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
            200: { description: "Lista de productos" },
          },
        },
      },
      "/productos/{codigo}": {
        get: {
          summary: "Buscar un producto",
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
            200: { description: "Producto encontrado" },
            404: { description: "Producto no encontrado" },
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
                schema: {
                  type: "object",
                  required: ["tenant_id", "usuario_id", "nombre", "precio", "stock"],
                  properties: {
                    tenant_id: { type: "string" },
                    usuario_id: { type: "string" },
                    nombre: { type: "string" },
                    precio: { type: "number" },
                    stock: { type: "number" },
                  },
                },
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
});

module.exports = { swaggerUi, swaggerSpec };

