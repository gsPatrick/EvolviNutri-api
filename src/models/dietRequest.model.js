// src/models/dietRequest.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DietRequest = sequelize.define('DietRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    clientName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clientEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    clientWhatsapp: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    planType: {
        type: DataTypes.ENUM('basic', 'premium'),
        allowNull: false,
    },
    formData: {
        type: DataTypes.JSONB, // Armazena todos os dados do formulário como um JSON
        allowNull: false,
    },
    generatedPlan: {
        type: DataTypes.TEXT, // Armazena o plano gerado pelo GPT
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM(
            'pending_payment', // <-- NOVO STATUS
            'payment_received',
            'generating_plan',
            'plan_sent',
            'awaiting_manual_review',
            'error'
        ),
        defaultValue: 'pending_payment', // <-- MUDAR VALOR PADRÃO
        allowNull: false,
    },
}, {
    tableName: 'diet_requests',
    timestamps: true,
});

module.exports = DietRequest;