const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { swaggerUi, getSwaggerSpec } = require("./utils/swagger");

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TABLA_COMPRAS = process.env.TABLE_NAME;
const TABLA_PRODUCTOS = process.env.PRODUCTOS_TABLE_NAME;
const BUCKET_COMPRAS = process.env.BUCKET_COMPRAS;

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  },
  body: JSON.stringify(body),
});

module.exports.comprar = async (event) => {
  try {
    const datos = JSON.parse(event.body);
    const { tenant_id, usuario_id, productos } = datos;

    if (!tenant_id || !usuario_id) {
      return buildResponse(400, { error: "tenant_id y usuario_id son requeridos" });
    }

    if (tenant_id !== "usuario") {
      return buildResponse(403, { error: "Solo los usuarios pueden realizar compras" });
    }

    let total = 0;

    for (const producto of productos) {
      const { producto_id, cantidad } = producto;

      const resultado = await dynamo
        .get({
          TableName: TABLA_PRODUCTOS,
          Key: {
            tenant_id: "admin",
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

      await dynamo
        .update({
          TableName: TABLA_PRODUCTOS,
          Key: {
            tenant_id: "admin",
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
      usuario_id,
      fecha: new Date().toISOString(),
      productos,
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
    const { tenant_id, usuario_id } = event.queryStringParameters || {};

    if (!tenant_id || !usuario_id) {
      return buildResponse(400, { error: "tenant_id y usuario_id son requeridos" });
    }

    const result = await dynamo
      .query({
        TableName: TABLA_COMPRAS,
        KeyConditionExpression: "tenant_id = :tenant_id",
        FilterExpression: "usuario_id = :usuario_id",
        ExpressionAttributeValues: {
          ":tenant_id": tenant_id,
          ":usuario_id": usuario_id,
        },
        ScanIndexForward: false,
      })
      .promise();

    return buildResponse(200, result.Items);
  } catch (err) {
    return buildResponse(500, { error: err.message });
  }
};

// OPTIONS para CORS preflight
module.exports.opcionesCompras = async () => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: "",
  };
};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/docs", (req, res) => {
  res.redirect("/docs/");
});

app.use("/docs", swaggerUi.serve, (req, res, next) => {
  const host = req.headers["host"];
  const stage = process.env.STAGE || "dev";
  const baseUrl = `https://${host}/${stage}`;
  const swaggerSpec = getSwaggerSpec(baseUrl);

  swaggerUi.setup(swaggerSpec)(req, res, next);
});

module.exports.swaggerDocs = serverless(app);

module.exports.actualizarCompras = async (event) => {
  try {
    for (const record of event.Records) {
      if (record.eventName === "INSERT") {
        const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        const fecha = newImage.fecha.split("T")[0];
        const tenantId = newImage.tenant_id;
        const compraId = newImage.id;

        const s3Key = `tenant_id=${tenantId}/fecha=${fecha}/${compraId}.json`;

        await s3
          .putObject({
            Bucket: BUCKET_COMPRAS,
            Key: s3Key,
            Body: JSON.stringify(newImage),
            ContentType: "application/json",
          })
          .promise();

        console.log(`Compra guardada en S3: ${s3Key}`);
      }
    }
  } catch (error) {
    console.error("Error procesando stream:", error);
  }
};

