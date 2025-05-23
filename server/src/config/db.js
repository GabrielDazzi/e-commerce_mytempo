// server/src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Garante que o .env da pasta server seja lido

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('Conectado ao banco de dados MySQL!');
    connection.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados MySQL:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Conexão com o banco de dados foi fechada.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Banco de dados tem muitas conexões.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Conexão com o banco de dados foi recusada.');
    }
    // process.exit(1); // Considere sair se a conexão falhar criticamente
  });

module.exports = pool;