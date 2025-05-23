<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); // Mostrar erros para este teste específico

echo "Iniciando teste de conexão db_config.php...<br>";

// Tenta incluir o arquivo de configuração
if (!@include_once 'db_config.php') {
    echo "ERRO FATAL: Não foi possível incluir db_config.php<br>";
    $error = error_get_last();
    if ($error) {
        echo "Último erro do PHP: <pre>" . print_r($error, true) . "</pre><br>";
    }
    exit;
}
echo "db_config.php incluído com sucesso.<br>";

// Verifica se a variável $link foi definida e se a conexão foi bem-sucedida
if (isset($link) && $link instanceof mysqli && !mysqli_connect_errno()) {
    echo "Conexão com o banco de dados MySQL via \$link bem-sucedida!<br>";
    echo "Host info: " . mysqli_get_host_info($link) . "<br>";
    mysqli_close($link);
} elseif (isset($link) && $link instanceof mysqli && mysqli_connect_errno()) {
    echo "ERRO: Conexão com o banco de dados MySQL falhou APÓS inclusão.<br>";
    echo "Erro de conexão mysqli: " . mysqli_connect_error() . "<br>";
    echo "Número do erro de conexão mysqli: " . mysqli_connect_errno() . "<br>";
} else {
    echo "ERRO: A variável \$link não foi definida corretamente por db_config.php ou a conexão falhou silenciosamente ANTES.<br>";
     if (function_exists('mysqli_connect_error') && mysqli_connect_error()){
         echo "Tentativa de erro de conexão global: " . mysqli_connect_error() . "<br>";
     }
}
?>