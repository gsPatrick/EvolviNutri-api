// app.js (localizado na raiz do projeto)

// 1. Carrega as variáveis de ambiente do arquivo .env no início de tudo
require('dotenv').config();

// 2. Importa as dependências necessárias
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes'); // Caminho ajustado para a pasta src
const database = require('./src/config/database'); // Caminho ajustado para a pasta src

// 3. Inicializa a aplicação Express
const app = express();


// --- Configuração de Middlewares ---

// 4. Habilita o CORS para todas as origens (liberado para todos)
// ATENÇÃO: Esta configuração é ideal para desenvolvimento. Para produção,
// é recomendado restringir a origem para o domínio do seu frontend.
// Ex: app.use(cors({ origin: 'https://www.evolvinutri.com.br' }));
app.use(cors());

// 5. Habilita o parser de JSON, permitindo que a API entenda corpos de requisição nesse formato
app.use(express.json());


// --- Rotas da Aplicação ---

// 6. Define o prefixo /api para todas as rotas importadas do arquivo de rotas principal
app.use('/api', routes);


// --- Tratamento de Erros Genérico (Opcional, mas boa prática) ---
// Este middleware será acionado se ocorrer um erro em alguma rota
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado no servidor!');
});


// --- Inicialização do Servidor e Conexão com o Banco de Dados ---
const PORT = process.env.PORT || 3333;

// 7. Tenta autenticar a conexão com o banco de dados
database.authenticate()
    .then(() => {
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
        
        // Após conectar, sincroniza os modelos com as tabelas do banco.
        // ATENÇÃO: Não use { force: true } em produção, pois isso apaga todas as tabelas e dados existentes.
        return database.sync(); 
    })
    .then(() => {
        // Se a conexão e a sincronização foram bem-sucedidas, inicia o servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        // Se houver qualquer erro na conexão ou sincronização, exibe no console
        console.error('❌ Não foi possível conectar e iniciar o servidor:', err);
    });