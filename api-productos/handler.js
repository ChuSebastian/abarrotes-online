const AWS = require("aws-sdk");
const axios = require("axios");
const { validarToken } = require("./utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

module.exports.crearProducto = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const item = {
      tenant_id,
      codigo: body.codigo,
      nombre: body.nombre,
      precio: body.precio,
      stock: body.stock
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Producto creado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.listarProductos = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const limit = parseInt(event.queryStringParameters?.limit || "10");
    const startKey = event.queryStringParameters?.startKey;

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "tenant_id = :tenant_id",
      ExpressionAttributeValues: { ":tenant_id": tenant_id },
      Limit: limit
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
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters?.codigo;
    if (!codigo) {
      throw new Error("Código no proporcionado");
    }

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
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters?.codigo;
    if (!codigo) {
      throw new Error("Código no proporcionado");
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    if (!body || !body.nombre || body.precio === undefined || body.stock === undefined) {
      throw new Error("Faltan campos obligatorios en el body");
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
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters?.codigo;
    if (!codigo) {
      throw new Error("Código no proporcionado");
    }

    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: "Producto eliminado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

// module.exports.procesarCambiosDynamo = async (event) => {
//   for (const record of event.Records) {
//     const tipo = record.eventName;
//     const nuevo = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage || {});
//     const anterior = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage || {});
// 
//     console.log("🔄 Evento recibido:", tipo);
// 
//     if (tipo === "INSERT") {
//       console.log("🟢 Producto creado:", nuevo);
//     } else if (tipo === "MODIFY") {
//       console.log("🟡 Producto modificado:");
//       console.log("Antes:", anterior);
//       console.log("Después:", nuevo);
//     } else if (tipo === "REMOVE") {
//       console.log("🔴 Producto eliminado:", anterior);
//     }
//   }
// 
//   return { statusCode: 200 };
// };

module.exports.actualizarProductos = async (event) => {
  for (const record of event.Records) {
    const tipo = record.eventName;
    const nuevo = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage || {});
    const anterior = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage || {});

    const tenant_id = nuevo.tenant_id || anterior.tenant_id;
    const codigo = nuevo.codigo || anterior.codigo;

    // Usamos la IP elástica fija de Elasticsearch
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

