// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT, // <-- ADICIONADO: Passa a porta para o Sequelize
        dialect: process.env.DB_DIALECT,
        logging: false, // Desative o logging de SQL no console se preferir
    }
);

module.exports = sequelize;