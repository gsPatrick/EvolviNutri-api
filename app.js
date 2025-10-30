// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const database = require('./config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

const PORT = process.env.PORT || 3333;

// Sincroniza o banco de dados e inicia o servidor
database.authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
        // Para desenvolvimento, você pode usar { force: true } para recriar as tabelas
        // ATENÇÃO: isso apaga todos os dados. Use com cuidado.
        return database.sync(); 
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });