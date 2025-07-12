const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { validarToken } = require("./utils/auth");

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLA_COMPRAS = process.env.TABLE_NAME;

const buildResponse = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body),
});

module.exports.comprar = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const datos = JSON.parse(event.body);
    const tablaProductos = `ProductosTable-${tenant_id}`;

    let total = 0;

    // Verificar y descontar stock
    for (const producto of datos.productos) {
      const { producto_id, cantidad } = producto;

      // Obtener stock actual
      const resultado = await dynamo
        .get({
          TableName: tablaProductos,
          Key: { tenant_id, producto_id },
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

      // Descontar stock
      await dynamo
        .update({
          TableName: tablaProductos,
          Key: { tenant_id, producto_id },
          UpdateExpression: "SET stock = stock - :cant",
          ConditionExpression: "stock >= :cant",
          ExpressionAttributeValues: {
            ":cant": cantidad,
          },
        })
        .promise();

      total += item.precio_unitario * cantidad;

      // Agregar precio a cada producto del array de respuesta
      producto.precio_unitario = item.precio_unitario;
    }

    // Guardar la compra
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

