const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { validarToken } = require("./utils/auth");

const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLA_COMPRAS = process.env.TABLA_COMPRAS;

const buildResponse = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body),
});

module.exports.comprar = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const datos = JSON.parse(event.body);

    const compra = {
      id: uuidv4(),
      tenant_id,
      fecha: new Date().toISOString(),
      productos: datos.productos, // array de productos comprados
      total: datos.total, // monto total
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
        ScanIndexForward: false, // orden descendente por fecha
      })
      .promise();

    return buildResponse(200, result.Items);
  } catch (err) {
    return buildResponse(500, { error: err.message });
  }
};

