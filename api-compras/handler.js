const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { validarToken } = require("./utils/auth");
const express = require("express");
const serverless = require("serverless-http");
const { swaggerUi, swaggerSpec } = require("./utils/swagger");

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLA_COMPRAS = process.env.TABLE_NAME;
const TABLA_PRODUCTOS = process.env.PRODUCTOS_TABLE_NAME;

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
  },
  body: JSON.stringify(body),
});

module.exports.comprar = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const datos = JSON.parse(event.body);

    let total = 0;

    for (const producto of datos.productos) {
      const { producto_id, cantidad } = producto;

      // Obtener producto desde DynamoDB
      const resultado = await dynamo
        .get({
          TableName: TABLA_PRODUCTOS,
          Key: {
            tenant_id,
            codigo: producto_id,
          },
        })
        .promise();

      const item = resultado.Item;
      if (!item) {
        return buildResponse(404, { error: `Producto ${producto_id} no encontrado` });
      }

      if (item.stock < cantidad) {
        return buildResponse(400, {
          error: `Stock insuficiente para producto ${producto_id}. Stock disponible: ${item.stock}`,
        });
      }

      if (typeof item.precio !== "number") {
        return buildResponse(500, {
          error: `El producto ${producto_id} no tiene un precio numérico válido.`,
        });
      }

      // Descontar stock
      await dynamo
        .update({
          TableName: TABLA_PRODUCTOS,
          Key: {
            tenant_id,
            codigo: producto_id,
          },
          UpdateExpression: "SET stock = stock - :cant",
          ConditionExpression: "stock >= :cant",
          ExpressionAttributeValues: {
            ":cant": cantidad,
          },
        })
        .promise();

      total += item.precio * cantidad;
      producto.precio_unitario = item.precio;
    }

    const compra = {
      id: uuidv4(),
      tenant_id,
      fecha: new Date().toISOString(),
      productos: datos.productos,
      total,
    };

    await dynamo
      .put({
        TableName: TABLA_COMPRAS,
        Item: compra,
      })
      .promise();

    return buildResponse(201, compra);
  } catch (err) {
    return buildResponse(500, { error: err.message });
  }
};

module.exports.obtenerCompras = async (event) => {
  try {
    const tenant_id = validarToken(event);

    const result = await dynamo
      .query({
        TableName: TABLA_COMPRAS,
        KeyConditionExpression: "tenant_id = :tenant_id",
        ExpressionAttributeValues: {
          ":tenant_id": tenant_id,
        },
        ScanIndexForward: false,
      })
      .promise();

    return buildResponse(200, result.Items);
  } catch (err) {
    return buildResponse(500, { error: err.message });
  }
};

module.exports.swaggerDocs = async (event, context) => {
  const app = express();

  const { stage, domainName } = event.requestContext;
  const baseUrl = `https://${domainName}/${stage}`;

  const { swaggerUi, getSwaggerSpec } = require("./utils/swagger");
  const swaggerSpec = getSwaggerSpec(baseUrl);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  const handler = serverless(app);
  return handler(event, context);
};

