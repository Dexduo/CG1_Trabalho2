// Importa o express
const express = require('express');
const path = require('path');

// Inicializa o express
const app = express();

// Serve a pasta public onde estão suas imagens e arquivos
app.use(express.static(path.join(__dirname, './')));

// Rota para o arquivo principal da aplicação
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webgl.html'));
});

// Define a porta do servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});