<?php
// api/db_config.php

// Defina suas credenciais do MySQL (obtenha do painel da Hostinger)
define('DB_SERVER', 'localhost'); // Ou o host fornecido pela Hostinger
define('DB_USERNAME', 'mytempo');
define('DB_PASSWORD', 'qebhog-bikfos-5qiTpy');
define('DB_NAME', 'mytempo_ecommerce'); // O nome do seu banco de dados

// Tentar conectar ao banco de dados MySQL
$link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Checar conexão
if($link === false){
    // Não use die() em produção para uma API JSON, retorne um erro JSON apropriado.
    // Para depuração inicial:
    // die("ERRO: Não foi possível conectar. " . mysqli_connect_error());

    // Para uma API, você faria algo como:
    // header('Content-Type: application/json');
    // http_response_code(500);
    // echo json_encode(['error' => 'Erro interno do servidor: Não foi possível conectar ao banco de dados.']);
    // exit;
}

// Opcional: Definir o charset para utf8mb4 para suportar emojis e caracteres especiais
mysqli_set_charset($link, "utf8mb4");

// A variável $link agora está disponível para ser usada nos seus scripts de endpoint.
?>