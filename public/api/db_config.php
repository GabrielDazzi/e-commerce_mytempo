<?php
// api/db_config.php

// VERIFIQUE ESTES VALORES COM ATENÇÃO NO SEU ARQUIVO NA HOSTINGER
define('DB_SERVER', 'localhost'); // Hostinger geralmente usa 'localhost' para scripts no mesmo servidor. Confirme no hPanel.
define('DB_USERNAME', 'u962773308_mytempo'); // Do seu print do phpMyAdmin/Hostinger.
define('DB_PASSWORD', 'qebhog-bikfos-5qiTpy'); // ESTA É A SENHA CRÍTICA.
define('DB_NAME', 'u962773308_mytempo_ecomme'); // Do seu print do phpMyAdmin/Hostinger.

$link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if($link === false){
    error_log("CRITICAL: Falha ao conectar ao banco de dados MySQL. Erro: " . mysqli_connect_error() . 
              " (Host: " . DB_SERVER . ", User: " . DB_USERNAME . ", DB: " . DB_NAME . ")");
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: https://portamedalhas.shop");
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(503); 
    }
    echo json_encode(['error' => 'Serviço indisponível no momento. Por favor, tente mais tarde.']);
    exit;
}

if (!mysqli_set_charset($link, "utf8mb4")) {
    error_log("Erro ao definir charset utf8mb4 para a conexão MySQL: " . mysqli_error($link));
}
?>