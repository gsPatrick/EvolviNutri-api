// src/config/mercadopago.js
const mercadopago = require("mercadopago");
require('dotenv').config();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN,
});

module.exports = mercadopago;