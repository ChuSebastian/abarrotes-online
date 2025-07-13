const AWS = require("aws-sdk");
const axios = require("axios");
const express = require("express");
const serverless = require("serverless-http");
const { swaggerUi, swaggerSpec } = require("./utils/swagger");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

function extraerUsuarioYTenant(event) {
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const { tenant_id, usuario_id } = body || {};
  if (!tenant_id || !usuario_id) throw new Error("Faltan tenant_id o usuario_id");
  return { tenant_id, usuario_id, body };
}

module.exports.crearProducto = async (event) => {
  try {
    const { tenant_id, usuario_id, body } = extraerUsuarioYTenant(event);

    if (tenant_id !== "admin") {
      return { statusCode: 403, body: JSON.stringify({ message: "Solo el admin puede crear productos" }) };
    }

    const { codigo, nombre, precio, stock } = body;

    if (!codigo || !nombre || precio === undefined || stock === undefined) {
      return { statusCode: 400, body: JSON.stringify({ message: "Faltan campos obligatorios" }) };
    }

    const item = {
      tenant_id,
      usuario_id,
      codigo,
      nombre,
      precio,
      stock,
      fecha_creacion: new Date().toISOString(),
    };

    await dynamodb.put({ TableName: TABLE_NAME, Item: item }).promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Producto creado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.listarProductos = async (event) => {
  try {
    const { tenant_id } = extraerUsuarioYTenant(event);
    const limit = parseInt(event.queryStringParameters?.limit || "10");
    const startKey = event.queryStringParameters?.startKey;

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "tenant_id = :tenant_id",
      ExpressionAttributeValues: { ":tenant_id": tenant_id },
      Limit: limit,
    };

    if (startKey) {
      params.ExclusiveStartKey = { tenant_id, codigo: startKey };
    }

    const result = await dynamodb.query(params).promise();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.buscarProducto = async (event) => {
  try {
    const { tenant_id } = extraerUsuarioYTenant(event);
    const codigo = event.pathParameters?.codigo;
    if (!codigo) throw new Error("Código no proporcionado");

    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo }
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Producto no encontrado" }) };
    }

    return { statusCode: 200, body: JSON.stringify(result.Item) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.modificarProducto = async (event) => {
  try {
    const { tenant_id, body } = extraerUsuarioYTenant(event);
    const codigo = event.pathParameters?.codigo;
    if (tenant_id !== "admin") return { statusCode: 403, body: JSON.stringify({ message: "No autorizado" }) };
    if (!codigo) throw new Error("Código no proporcionado");

    if (!body.nombre || body.precio === undefined || body.stock === undefined) {
      throw new Error("Faltan campos obligatorios");
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo },
      UpdateExpression: "SET nombre = :n, precio = :p, stock = :s",
      ExpressionAttributeValues: {
        ":n": body.nombre,
        ":p": body.precio,
        ":s": body.stock
      }
    };

    await dynamodb.update(params).promise();
    return { statusCode: 200, body: JSON.stringify({ message: "Producto actualizado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.eliminarProducto = async (event) => {
  try {
    const { tenant_id } = extraerUsuarioYTenant(event);
    const codigo = event.pathParameters?.codigo;
    if (tenant_id !== "admin") return { statusCode: 403, body: JSON.stringify({ message: "No autorizado" }) };
    if (!codigo) throw new Error("Código no proporcionado");

    await dynamodb.delete({ TableName: TABLE_NAME, Key: { tenant_id, codigo } }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: "Producto eliminado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.actualizarProductos = async (event) => {
  for (const record of event.Records) {
    const tipo = record.eventName;
    const nuevo = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage || {});
    const anterior = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage || {});

    const tenant_id = nuevo.tenant_id || anterior.tenant_id;
    const codigo = nuevo.codigo || anterior.codigo;
    const elasticUrl = `http://52.44.161.7:9200/productos-${tenant_id}/_doc/${codigo}`;

    try {
      if (tipo === "INSERT" || tipo === "MODIFY") {
        await axios.put(elasticUrl, nuevo);
        console.log(`📤 Producto sincronizado en Elasticsearch: ${codigo}`);
      } else if (tipo === "REMOVE") {
        await axios.delete(elasticUrl);
        console.log(`🗑️ Producto eliminado de Elasticsearch: ${codigo}`);
      }
    } catch (error) {
      console.error("❌ Error al conectar con Elasticsearch:", error.message);
    }
  }

  return { statusCode: 200 };
};

module.exports.swaggerDocs = async (event, context) => {
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  const host = event.headers["Host"];
  const stage = event.requestContext.stage;
  const basePath = `https://${host}/${stage}`;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [{ url: basePath }],
  };

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(dynamicSpec));

  const handler = serverless(app);
  return handler(event, context);
};

