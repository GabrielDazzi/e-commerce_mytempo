// server/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(cors()); // Para produção, configure origens específicas: app.use(cors({ origin: 'https://portamedalhas.shop' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.get('/', (req, res) => {
    res.send('API do E-commerce MyTempo está funcionando!');
});
app.use('/api/products', productRoutes);

// Tratamento de erro básico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

app.listen(PORT, () => {
    console.log(`Servidor da API rodando na porta ${PORT}`);
    console.log(`Endpoints de produtos em: http://localhost:${PORT}/api/products`);
});