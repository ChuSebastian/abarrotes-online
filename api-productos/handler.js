const AWS = require("aws-sdk");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { swaggerUi, swaggerSpec } = require("./utils/swagger");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  body: JSON.stringify(body),
});

function extraerDatos(event) {
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const { tenant_id, usuario_id } = body || {};

  if (!tenant_id) throw new Error("Falta tenant_id");

  if (tenant_id !== "admin" && !usuario_id) {
    throw new Error("Falta usuario_id para tenant usuario");
  }

  return { tenant_id, usuario_id, body };
}

module.exports.opcionesGenerico = async () => buildResponse(200, {});

module.exports.crearProducto = async (event) => {
  if (event.httpMethod === "OPTIONS") return buildResponse(200, {});
  try {
    const { tenant_id, usuario_id, body } = extraerDatos(event);

    if (tenant_id !== "admin") {
      return buildResponse(403, { message: "Solo el admin puede crear productos" });
    }

    const { codigo, nombre, precio, stock } = body;
    if (!codigo || !nombre || precio === undefined || stock === undefined) {
      return buildResponse(400, { message: "Faltan campos obligatorios" });
    }

    const item = {
      tenant_id,
      codigo,
      usuario_id: usuario_id || "admin",
      nombre,
      precio,
      stock,
      fecha_creacion: new Date().toISOString(),
    };

    await dynamodb.put({ TableName: TABLE_NAME, Item: item }).promise();
    return buildResponse(201, { message: "Producto creado" });
  } catch (e) {
    return buildResponse(400, { error: e.message });
  }
};

module.exports.listarProductos = async (event) => {
  if (event.httpMethod === "OPTIONS") return buildResponse(200, {});
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "tenant_id = :t",
      ExpressionAttributeValues: {
        ":t": "admin",
      },
    };

    const result = await dynamodb.query(params).promise();
    return buildResponse(200, { Items: result.Items });
  } catch (e) {
    return buildResponse(400, { error: e.message });
  }
};

module.exports.buscarProducto = async (event) => {
  if (event.httpMethod === "OPTIONS") return buildResponse(200, {});
  try {
    const codigo = event.pathParameters?.codigo;
    if (!codigo) throw new Error("Falta el código del producto");

    const params = {
      TableName: TABLE_NAME,
      Key: { tenant_id: "admin", codigo },
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return buildResponse(404, { error: "Producto no encontrado" });
    }

    return buildResponse(200, result.Item);
  } catch (e) {
    return buildResponse(400, { error: e.message });
  }
};

module.exports.modificarProducto = async (event) => {
  if (event.httpMethod === "OPTIONS") return buildResponse(200, {});
  try {
    const { tenant_id, body } = extraerDatos(event);
    const codigo = event.pathParameters?.codigo;

    if (tenant_id !== "admin") {
      return buildResponse(403, { message: "Solo admin puede modificar productos" });
    }

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
        ":s": body.stock,
      },
    };

    await dynamodb.update(params).promise();
    return buildResponse(200, { message: "Producto actualizado" });
  } catch (e) {
    return buildResponse(400, { error: e.message });
  }
};

module.exports.eliminarProducto = async (event) => {
  if (event.httpMethod === "OPTIONS") return buildResponse(200, {});
  try {
    const { tenant_id } = extraerDatos(event);
    const codigo = event.pathParameters?.codigo;

    if (tenant_id !== "admin") {
      return buildResponse(403, { message: "Solo admin puede eliminar productos" });
    }

    if (!codigo) throw new Error("Código no proporcionado");

    await dynamodb.delete({ TableName: TABLE_NAME, Key: { tenant_id, codigo } }).promise();
    return buildResponse(200, { message: "Producto eliminado" });
  } catch (e) {
    return buildResponse(400, { error: e.message });
  }
};

module.exports.actualizarProductos = async (event) => {
  for (const record of event.Records) {
    const tipo = record.eventName;
    const nuevo = record.dynamodb.NewImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) : {};
    const anterior = record.dynamodb.OldImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage) : {};

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

// Swagger
const app = express();
app.use(cors());
app.use(express.json());

app.get("/docs", (req, res) => res.redirect("/docs/"));

app.use("/docs", swaggerUi.serve, (req, res, next) => {
  const host = req.headers["host"];
  const stage = process.env.STAGE || "dev";
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [{ url: `https://${host}/${stage}`, description: `Stage: ${stage}` }],
  };

  swaggerUi.setup(dynamicSpec)(req, res, next);
});

module.exports.swaggerDocs = serverless(app);

