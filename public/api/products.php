<?php
// api/products.php

// Configurações de erro para PRODUÇÃO: Logar erros, não exibir para o cliente.
ini_set('display_errors', 0); 
ini_set('log_errors', 1);
// Opcional: defina um arquivo de log específico se o padrão do servidor Hostinger não for suficiente
// ini_set('error_log', dirname(__FILE__) . '/php-error-production.log'); 
// error_reporting(E_ALL); // Mantenha E_ALL para logar todos os tipos de erro

// Função helper para enviar respostas JSON padronizadas
function send_json_response($data, $statusCode = 200) {
    global $link; // Para fechar a conexão se estiver aberta
    if (!headers_sent()) {
        // EM PRODUÇÃO, SEJA ESPECÍFICO COM O DOMÍNIO
        header("Access-Control-Allow-Origin: https://portamedalhas.shop"); 
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Max-Age: 3600");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
        http_response_code($statusCode);
    }
    echo json_encode($data);
    
    // Fecha a conexão se $link for um objeto mysqli válido e a conexão estiver ativa
    if (isset($link) && $link instanceof mysqli && mysqli_ping($link)) {
        mysqli_close($link);
    }
    exit;
}

// Tenta incluir o arquivo de configuração do banco de dados
if (!@include_once 'db_config.php') {
    error_log("products.php: CRITICAL - Falha fatal ao incluir db_config.php.");
    send_json_response(['error' => 'Erro crítico na configuração interna do servidor (DB Config).'], 500);
}

// Verifica se a conexão com o banco de dados ($link) foi estabelecida em db_config.php
if (!isset($link) || !($link instanceof mysqli) || mysqli_connect_errno()) {
    $db_conn_error_detail = 'Desconhecido';
    if (function_exists('mysqli_connect_error')) {
      $db_conn_error_detail = mysqli_connect_error();
    }
    if (!isset($link) || !($link instanceof mysqli)) {
        $db_conn_error_detail = 'Variável de conexão $link não é um objeto mysqli válido ou falhou em db_config.php.';
    }
    error_log("products.php: Falha na conexão com o banco de dados. Erro: " . $db_conn_error_detail);
    send_json_response(['error' => 'Serviço de banco de dados indisponível no momento.'], 503);
}

$method = $_SERVER['REQUEST_METHOD'];

// Tratar requisições OPTIONS (preflight CORS) ANTES de qualquer outra lógica
if ($method == 'OPTIONS') {
    send_json_response(null, 204); // No Content
}

// Função para gerar UUID v4 (se não estiver usando AUTO_INCREMENT para IDs)
function generate_uuid_v4_php() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, // Define o 4º bit do 7º byte para 0100 (versão 4)
        mt_rand(0, 0x3fff) | 0x8000, // Define os 2 bits mais significativos do 9º byte para 10 (variante RFC 4122)
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function formatProductFromDB_PHP($dbProduct) {
    if (!$dbProduct || !is_array($dbProduct)) {
        error_log("formatProductFromDB_PHP: Recebeu dados inválidos ou nulos.");
        return null;
    }
    try {
        // Converte booleanos do MySQL (0 ou 1) para true/false do JavaScript
        $featured = isset($dbProduct['featured']) ? boolval(intval($dbProduct['featured'])) : false;
        $allowCustomization = isset($dbProduct['allow_customization']) ? boolval(intval($dbProduct['allow_customization'])) : false;
        // Assumindo que os nomes das colunas no BD são sem underscore para as novas flags, conforme erro original
        $allowCustomName = isset($dbProduct['allowcustomname']) ? boolval(intval($dbProduct['allowcustomname'])) : false;
        $allowCustomModality = isset($dbProduct['allowcustommodality']) ? boolval(intval($dbProduct['allowcustommodality'])) : false;
        $allowCustomColorSelection = isset($dbProduct['allowcustomcolorselection']) ? boolval(intval($dbProduct['allowcustomcolorselection'])) : false;

        $product = [
            'id' => $dbProduct['id'] ?? null,
            'name' => $dbProduct['name'] ?? null,
            'description' => $dbProduct['description'] ?? null,
            'price' => isset($dbProduct['price']) ? floatval($dbProduct['price']) : 0.0,
            'category' => $dbProduct['category'] ?? null,
            'imageUrl' => $dbProduct['image_url'] ?? null, // Frontend espera imageUrl
            'stock' => isset($dbProduct['stock']) ? intval($dbProduct['stock']) : 0,
            'featured' => $featured,
            'discount' => isset($dbProduct['discount']) ? intval($dbProduct['discount']) : 0,
            'createdAt' => $dbProduct['created_at'] ?? null, 
            // Tenta decodificar JSON, retorna array vazio em caso de falha ou se o campo for null/ausente
            'descriptionImages' => isset($dbProduct['description_images']) && is_string($dbProduct['description_images']) ? (json_decode($dbProduct['description_images'], true) ?: []) : ($dbProduct['description_images'] ?? []),
            'specificationImages' => isset($dbProduct['specification_images']) && is_string($dbProduct['specification_images']) ? (json_decode($dbProduct['specification_images'], true) ?: []) : ($dbProduct['specification_images'] ?? []),
            'deliveryImages' => isset($dbProduct['delivery_images']) && is_string($dbProduct['delivery_images']) ? (json_decode($dbProduct['delivery_images'], true) ?: []) : ($dbProduct['delivery_images'] ?? []),
            'allowCustomization' => $allowCustomization,
            'allowCustomName' => $allowCustomName,
            'allowCustomModality' => $allowCustomModality,
            'allowCustomColorSelection' => $allowCustomColorSelection,
            'colors' => isset($dbProduct['colors']) && is_string($dbProduct['colors']) ? (json_decode($dbProduct['colors'], true) ?: []) : ($dbProduct['colors'] ?? []),
            'specifications' => isset($dbProduct['specifications']) && is_string($dbProduct['specifications']) ? (json_decode($dbProduct['specifications'], true) ?: []) : ($dbProduct['specifications'] ?? []),
        ];
        return $product;
    } catch (Exception $e) {
        error_log("PHP Exception (formatProductFromDB_PHP): ID " . ($dbProduct['id'] ?? 'N/A') . " - " . $e->getMessage());
        return null; 
    }
}

function formatProductForDB_PHP($productData, $is_update = false) {
    $data = [];
    
    // Mapeia do frontend para as colunas do BD e serializa JSON / converte booleanos para 0/1
    // As chaves aqui devem corresponder exatamente aos nomes das colunas no seu banco de dados MySQL.
    if (isset($productData['name'])) $data['name'] = $productData['name'];
    if (isset($productData['description'])) $data['description'] = $productData['description'];
    if (isset($productData['price'])) $data['price'] = floatval($productData['price']);
    if (isset($productData['category'])) $data['category'] = $productData['category'];
    
    // O frontend envia image_url, mas a coluna do BD é image_url
    $data['image_url'] = $productData['image_url'] ?? ($productData['imageUrl'] ?? null);

    if (isset($productData['stock'])) $data['stock'] = intval($productData['stock']);
    if (isset($productData['featured'])) $data['featured'] = $productData['featured'] ? 1 : 0;
    if (isset($productData['discount'])) $data['discount'] = intval($productData['discount']);
    
    // Campos JSON - o frontend deve enviar a string JSON correta ou um array/objeto que será stringificado aqui
    $data['description_images'] = is_string($productData['description_images'] ?? null) ? $productData['description_images'] : json_encode($productData['descriptionImages'] ?? []);
    $data['specification_images'] = is_string($productData['specification_images'] ?? null) ? $productData['specification_images'] : json_encode($productData['specificationImages'] ?? []);
    $data['delivery_images'] = is_string($productData['delivery_images'] ?? null) ? $productData['delivery_images'] : json_encode($productData['deliveryImages'] ?? []);
    
    // Flags de personalização (colunas do BD: allow_customization, allowcustomname, etc.)
    $data['allow_customization'] = (isset($productData['allow_customization']) && $productData['allow_customization']) || (isset($productData['allowCustomization']) && $productData['allowCustomization']) ? 1 : 0;
    $data['allowcustomname'] = (isset($productData['allowcustomname']) && $productData['allowcustomname']) || (isset($productData['allowCustomName']) && $productData['allowCustomName']) ? 1 : 0;
    $data['allowcustommodality'] = (isset($productData['allowcustommodality']) && $productData['allowcustommodality']) || (isset($productData['allowCustomModality']) && $productData['allowCustomModality']) ? 1 : 0;
    $data['allowcustomcolorselection'] = (isset($productData['allowcustomcolorselection']) && $productData['allowcustomcolorselection']) || (isset($productData['allowCustomColorSelection']) && $productData['allowCustomColorSelection']) ? 1 : 0;
    
    $data['colors'] = is_string($productData['colors'] ?? null) ? $productData['colors'] : json_encode($productData['colors'] ?? []);
    $data['specifications'] = is_string($productData['specifications'] ?? null) ? $productData['specifications'] : json_encode($productData['specifications'] ?? []);

    if (!$is_update) { 
        // Se o ID for AUTO_INCREMENT, não defina 'id'. Se for UUID, o frontend deve enviar ou gere aqui.
        $data['id'] = $productData['id'] ?? generate_uuid_v4_php();
    }
    // created_at é gerenciado pelo MySQL (DEFAULT CURRENT_TIMESTAMP)
    return $data;
}


// --- LÓGICA PRINCIPAL DOS MÉTODOS HTTP ---
// Envolve toda a lógica em um try-catch para capturar exceções e enviar uma resposta JSON de erro.
try {
    if ($method == 'GET') {
        global $link; 
        $id = $_GET['id'] ?? null;
        $featured_param = $_GET['featured'] ?? null; 
        $category = $_GET['category'] ?? null;
        $term = $_GET['term'] ?? null;
        $sql = "";
        $params = [];
        $types = "";

        if ($id) {
            $sql = "SELECT * FROM products WHERE id = ?";
            $params[] = $id;
            $types .= "s";
        } elseif ($featured_param === 'true') { 
            $sql = "SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC";
        } elseif ($category) {
            $sql = "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC";
            $params[] = $category;
            $types .= "s";
        } elseif ($term) {
            $searchTermPrepared = "%".$term."%";
            $sql = "SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC";
            $params[] = $searchTermPrepared;
            $params[] = $searchTermPrepared;
            $types .= "ss";
        } else {
            $sql = "SELECT * FROM products ORDER BY created_at DESC";
        }

        $stmt = mysqli_prepare($link, $sql);
        if ($stmt === false) {
            throw new Exception("Erro ao preparar a consulta SQL (GET): " . mysqli_error($link) . " | SQL: " . $sql);
        }
        if (!empty($params) && !empty($types)) {
            if (strlen($types) !== count($params)) {
                 throw new Exception("Discrepância no número de tipos e parâmetros para bind_param (GET). Tipos: '$types', Parâmetros: " . count($params));
            }
            mysqli_stmt_bind_param($stmt, $types, ...$params);
        }
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Erro ao executar a consulta SQL (GET): " . mysqli_stmt_error($stmt));
        }
        $result = mysqli_stmt_get_result($stmt);
        
        $output_data = [];
        if ($id) { 
            if ($result && mysqli_num_rows($result) > 0) {
                $product_db = mysqli_fetch_assoc($result);
                $output_data = formatProductFromDB_PHP($product_db);
                send_json_response($output_data, 200);
            } else {
                send_json_response(['message' => 'Produto não encontrado.'], 404);
            }
        } else { 
            $products_array = [];
            if ($result) {
                while($row = mysqli_fetch_assoc($result)){
                    $formattedProduct = formatProductFromDB_PHP($row);
                    if ($formattedProduct) $products_array[] = $formattedProduct;
                }
            }
            send_json_response($products_array, 200);
        }
        mysqli_stmt_close($stmt);

    } 
    elseif ($method == 'POST') {
        global $link;
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, TRUE); 

        if (json_last_error() !== JSON_ERROR_NONE || empty($input) || !isset($input['name'])) {
            send_json_response(['message' => 'Dados inválidos, JSON malformado ou nome do produto ausente.', 'json_error_debug' => json_last_error_msg(), 'received_input_debug' => $inputJSON], 400);
        }
        
        // Se o ID for AUTO_INCREMENT no MySQL, remova a linha abaixo e não inclua 'id' em $dataToInsert.
        $input['id'] = $input['id'] ?? generate_uuid_v4_php(); 
        $dataToInsert = formatProductForDB_PHP($input, false);
        
        unset($dataToInsert['created_at']); // O BD gerencia

        $columns = [];
        $valuesForBind = [];
        $types = "";
        
        foreach ($dataToInsert as $col => $val) {
            $columns[] = "`$col`"; // Envolver nomes de colunas com crases
            $valuesForBind[] = $val; 
            if (is_int($val) || is_bool($val)) $types .= "i"; // booleanos como inteiros
            elseif (is_float($val)) $types .= "d";
            else $types .= "s"; 
        }

        if (empty($columns)) {
            send_json_response(['message' => 'Nenhum dado válido para inserir.'], 400);
        }
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $sql = "INSERT INTO products (" . implode(", ", $columns) . ") VALUES (" . $placeholders . ")";
        
        $stmt = mysqli_prepare($link, $sql);
        if ($stmt === false) {
            throw new Exception("Erro ao preparar a consulta SQL (POST): " . mysqli_error($link) . " | SQL: " . $sql);
        }

        if (!empty($types) && count($valuesForBind) == strlen($types)) {
            mysqli_stmt_bind_param($stmt, $types, ...$valuesForBind);
        } else if (!empty($types)) {
            throw new Exception("Erro interno (bind_param POST): Contagem de tipos e valores não coincide. Tipos: '$types', Valores: " . count($valuesForBind) . " SQL: " . $sql);
        }

        if(!mysqli_stmt_execute($stmt)){
            throw new Exception("Erro ao executar a criação do produto (POST): " . mysqli_stmt_error($stmt) . " | SQL: " . $sql);
        }
        
        $final_id = $dataToInsert['id']; // Se você gerou/usou UUID
        // $final_id = mysqli_insert_id($link); // DESCOMENTE ESTA LINHA SE SEU ID FOR AUTO_INCREMENT E COMENTE A LINHA ACIMA
        mysqli_stmt_close($stmt);

        $sql_select = "SELECT * FROM products WHERE id = ?";
        $stmt_select = mysqli_prepare($link, $sql_select);
        mysqli_stmt_bind_param($stmt_select, "s", $final_id); 
        mysqli_stmt_execute($stmt_select);
        $result_select = mysqli_stmt_get_result($stmt_select);

        if ($result_select && mysqli_num_rows($result_select) > 0) {
            $newProduct_db = mysqli_fetch_assoc($result_select);
            send_json_response(formatProductFromDB_PHP($newProduct_db), 201);
        } else {
            error_log("PHP POST - Produto criado (ID: $final_id) mas erro ao rebuscar detalhes.");
            send_json_response(['message' => 'Produto criado, mas erro ao buscar detalhes.', 'id' => $final_id], 201);
        }
        mysqli_stmt_close($stmt_select);
    }
    elseif ($method == 'PUT') {
        global $link;
        $id = $_GET['id'] ?? null; 
        if (!$id) {
            send_json_response(['message' => 'ID do produto é obrigatório na URL para atualização.'], 400);
        }
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, TRUE);

        if (json_last_error() !== JSON_ERROR_NONE || empty($input)) {
            send_json_response(['message' => 'Dados inválidos ou JSON malformado para atualização.', 'json_error_debug' => json_last_error_msg()], 400);
        }

        $dataToUpdate = formatProductForDB_PHP($input, true); 
        unset($dataToUpdate['id']); 
        unset($dataToUpdate['created_at']); 

        if (empty($dataToUpdate)) {
            $sql_noop = "SELECT * FROM products WHERE id = ?"; 
            $stmt_noop = mysqli_prepare($link, $sql_noop);
            mysqli_stmt_bind_param($stmt_noop, "s", $id);
            mysqli_stmt_execute($stmt_noop);
            $result_noop = mysqli_stmt_get_result($stmt_noop);
            if ($result_noop && mysqli_num_rows($result_noop) > 0) {
                send_json_response(formatProductFromDB_PHP(mysqli_fetch_assoc($result_noop)), 200);
            } else {
                send_json_response(['message' => 'Produto não encontrado ou nenhum dado para alterar.'], 404);
            }
            mysqli_stmt_close($stmt_noop);
            exit;
        }

        $setClauses = [];
        $updateValues = [];
        $types = "";
        foreach ($dataToUpdate as $column => $value) {
            $setClauses[] = "`$column` = ?";
            $updateValues[] = $value;
            if (is_int($value) || is_bool($value)) $types .= "i";
            elseif (is_float($value)) $types .= "d";
            else $types .= "s"; 
        }
        $updateValues[] = $id; 
        $types .= 's'; // Para o ID no WHERE

        $sql = "UPDATE products SET " . implode(", ", $setClauses) . " WHERE id = ?";
        
        $stmt = mysqli_prepare($link, $sql);
        if ($stmt === false) {
            throw new Exception("Erro ao preparar a consulta SQL (PUT): " . mysqli_error($link) . " | SQL: " . $sql);
        }
        if (!empty($types) && count($updateValues) == strlen($types)) {
            mysqli_stmt_bind_param($stmt, $types, ...$updateValues);
        } else if (!empty($types)){
            throw new Exception("Erro interno (bind_param PUT): Contagem de tipos e valores não coincide. Tipos: '$types', Valores: " . count($updateValues) . " | SQL: " . $sql);
        }

        if(!mysqli_stmt_execute($stmt)){
            throw new Exception("Erro ao executar a atualização do produto (PUT): " . mysqli_stmt_error($stmt) . " | SQL: " . $sql);
        }
        
        mysqli_stmt_close($stmt);
        $sql_select = "SELECT * FROM products WHERE id = ?";
        $stmt_select = mysqli_prepare($link, $sql_select);
        mysqli_stmt_bind_param($stmt_select, "s", $id);
        mysqli_stmt_execute($stmt_select);
        $result_select = mysqli_stmt_get_result($stmt_select);
        
        if ($result_select && mysqli_num_rows($result_select) > 0) {
            $updatedProduct_db = mysqli_fetch_assoc($result_select);
            send_json_response(formatProductFromDB_PHP($updatedProduct_db), 200);
        } else {
            send_json_response(['message' => 'Produto não encontrado após tentativa de atualização.'], 404);
        }
        mysqli_stmt_close($stmt_select);
    }
    elseif ($method == 'DELETE') {
        global $link;
        $id = $_GET['id'] ?? null;
        if (!$id) {
            send_json_response(['message' => 'ID do produto é obrigatório para exclusão.'], 400);
        }
        
        $sql = "DELETE FROM products WHERE id = ?";
        $stmt = mysqli_prepare($link, $sql);
        if ($stmt === false) {
            throw new Exception("Erro ao preparar a consulta SQL (DELETE): " . mysqli_error($link));
        }
        mysqli_stmt_bind_param($stmt, "s", $id);

        if(!mysqli_stmt_execute($stmt)){
            throw new Exception("Erro ao excluir produto (DELETE): " . mysqli_stmt_error($stmt));
        }
        
        if (mysqli_stmt_affected_rows($stmt) > 0) {
            send_json_response(['message' => 'Produto excluído com sucesso.'], 200);
        } else {
            send_json_response(['message' => 'Produto não encontrado para exclusão ou nenhuma linha afetada.'], 404);
        }
        mysqli_stmt_close($stmt);
    }
    else {
        send_json_response(['message' => 'Método HTTP não permitido.'], 405);
    }
} catch (Exception $e) {
    error_log("PHP Exception (Global Catch): " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine() . " Stack: " . $e->getTraceAsString());
    // Para produção, não envie detalhes da exceção ao cliente
    send_json_response(['error' => 'Ocorreu um erro inesperado no servidor.'], 500);
}
?>