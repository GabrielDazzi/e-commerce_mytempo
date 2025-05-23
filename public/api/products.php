<?php
// api/products.php
error_reporting(E_ALL); // Para desenvolvimento, mostrar todos os erros
ini_set('display_errors', 0); // DESLIGAR display_errors para API, usar log para erros
ini_set('log_errors', 1);    // Ligar log de erros
// Opcional: definir um arquivo de log específico para o PHP
// ini_set('error_log', '/caminho/para/seu/php-error.log');
// Se não definido, usará o error_log do servidor (Apache)

// Função para enviar resposta JSON e sair
function send_json_response($data, $statusCode = 200) {
    global $link; // Para fechar a conexão
    header("Access-Control-Allow-Origin: *"); // Ajuste em produção
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    http_response_code($statusCode);
    echo json_encode($data);

    if (isset($link) && is_object($link) && get_class($link) === 'mysqli') {
        mysqli_close($link);
    }
    exit;
}

// Tenta incluir o arquivo de configuração do banco de dados
if (!@include_once 'db_config.php') {
    error_log("products.php: CRITICAL - Falha ao incluir db_config.php.");
    send_json_response(['error' => 'Erro crítico na configuração do servidor.'], 500);
}

// Verifica se a conexão com o banco de dados ($link) foi estabelecida em db_config.php
if (!isset($link) || $link === false || mysqli_connect_errno()) {
    error_log("products.php: Falha na conexão com o banco de dados. Erro: " . (isset($link) ? mysqli_connect_error() : 'Link não definido'));
    send_json_response([
        'error' => 'Erro interno do servidor: Falha na conexão com o banco de dados.',
        'details' => (isset($link) ? mysqli_connect_error() : 'Variável $link não definida ou falhou em db_config.php')
    ], 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    send_json_response(null, 204); // No Content
}

function generate_uuid_v4_php() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function formatProductFromDB_PHP($dbProduct) {
    if (!$dbProduct) return null;
    try {
        $product = [
            'id' => $dbProduct['id'],
            'name' => $dbProduct['name'],
            'description' => $dbProduct['description'],
            'price' => isset($dbProduct['price']) ? floatval($dbProduct['price']) : 0,
            'category' => $dbProduct['category'],
            'imageUrl' => $dbProduct['image_url'],
            'stock' => isset($dbProduct['stock']) ? intval($dbProduct['stock']) : 0,
            'featured' => isset($dbProduct['featured']) ? boolval(intval($dbProduct['featured'])) : false,
            'discount' => isset($dbProduct['discount']) ? intval($dbProduct['discount']) : 0,
            'createdAt' => $dbProduct['created_at'],
            'descriptionImages' => isset($dbProduct['description_images']) && is_string($dbProduct['description_images']) ? json_decode($dbProduct['description_images'], true) ?: [] : ($dbProduct['description_images'] ?? []),
            'specificationImages' => isset($dbProduct['specification_images']) && is_string($dbProduct['specification_images']) ? json_decode($dbProduct['specification_images'], true) ?: [] : ($dbProduct['specification_images'] ?? []),
            'deliveryImages' => isset($dbProduct['delivery_images']) && is_string($dbProduct['delivery_images']) ? json_decode($dbProduct['delivery_images'], true) ?: [] : ($dbProduct['delivery_images'] ?? []),
            'allowCustomization' => isset($dbProduct['allow_customization']) ? boolval(intval($dbProduct['allow_customization'])) : false,
            'allowCustomName' => isset($dbProduct['allowcustomname']) ? boolval(intval($dbProduct['allowcustomname'])) : false,
            'allowCustomModality' => isset($dbProduct['allowcustommodality']) ? boolval(intval($dbProduct['allowcustommodality'])) : false,
            'allowCustomColorSelection' => isset($dbProduct['allowcustomcolorselection']) ? boolval(intval($dbProduct['allowcustomcolorselection'])) : false,
            'colors' => isset($dbProduct['colors']) && is_string($dbProduct['colors']) ? json_decode($dbProduct['colors'], true) ?: [] : ($dbProduct['colors'] ?? []),
            'specifications' => isset($dbProduct['specifications']) && is_string($dbProduct['specifications']) ? json_decode($dbProduct['specifications'], true) ?: [] : ($dbProduct['specifications'] ?? []),
        ];
        return $product;
    } catch (Exception $e) {
        error_log("PHP Error (formatProductFromDB_PHP): ID " . ($dbProduct['id'] ?? 'N/A') . " - " . $e->getMessage());
        return null;
    }
}

function formatProductForDB_PHP($productData, $is_update = false) {
    $data = [];
    // Mapeia do frontend para as colunas do BD
    if (isset($productData['name'])) $data['name'] = $productData['name'];
    if (isset($productData['description'])) $data['description'] = $productData['description'];
    if (isset($productData['price'])) $data['price'] = floatval($productData['price']);
    if (isset($productData['category'])) $data['category'] = $productData['category'];

    // Prioriza image_url se vier, senão imageUrl
    $data['image_url'] = $productData['image_url'] ?? ($productData['imageUrl'] ?? null);

    if (isset($productData['stock'])) $data['stock'] = intval($productData['stock']);
    if (isset($productData['featured'])) $data['featured'] = $productData['featured'] ? 1 : 0;
    if (isset($productData['discount'])) $data['discount'] = intval($productData['discount']);

    // Campos JSON - o frontend deve enviar a string JSON correta
    $data['description_images'] = $productData['description_images'] ?? ($productData['descriptionImages'] ? json_encode($productData['descriptionImages']) : json_encode([]));
    $data['specification_images'] = $productData['specification_images'] ?? ($productData['specificationImages'] ? json_encode($productData['specificationImages']) : json_encode([]));
    $data['delivery_images'] = $productData['delivery_images'] ?? ($productData['deliveryImages'] ? json_encode($productData['deliveryImages']) : json_encode([]));

    $data['allow_customization'] = (isset($productData['allow_customization']) && $productData['allow_customization']) || (isset($productData['allowCustomization']) && $productData['allowCustomization']) ? 1 : 0;
    $data['allowcustomname'] = (isset($productData['allowcustomname']) && $productData['allowcustomname']) || (isset($productData['allowCustomName']) && $productData['allowCustomName']) ? 1 : 0;
    $data['allowcustommodality'] = (isset($productData['allowcustommodality']) && $productData['allowcustommodality']) || (isset($productData['allowCustomModality']) && $productData['allowCustomModality']) ? 1 : 0;
    $data['allowcustomcolorselection'] = (isset($productData['allowcustomcolorselection']) && $productData['allowcustomcolorselection']) || (isset($productData['allowCustomColorSelection']) && $productData['allowCustomColorSelection']) ? 1 : 0;

    $data['colors'] = $productData['colors'] ?? json_encode([]); // Garante que é uma string JSON
    $data['specifications'] = $productData['specifications'] ?? json_encode([]); // Garante que é uma string JSON

    if (!$is_update) { // Apenas para INSERT
        $data['id'] = $productData['id'] ?? generate_uuid_v4_php();
    }
    // created_at é gerenciado pelo MySQL
    return $data;
}

// --- LÓGICA DOS MÉTODOS HTTP ---
if ($method == 'GET') {
    global $link;
    // ... (código GET da resposta anterior, usando prepared statements)
    // Certifique-se que os logs de erro estão implementados como abaixo para POST/PUT/DELETE
    $id = $_GET['id'] ?? null;
    $featured = isset($_GET['featured']) && filter_var($_GET['featured'], FILTER_VALIDATE_BOOLEAN);
    $category = $_GET['category'] ?? null;
    $term = $_GET['term'] ?? null;
    $sql = "";
    $params = [];
    $types = "";

    if ($id) {
        $sql = "SELECT * FROM products WHERE id = ?";
        $params[] = $id;
        $types .= "s";
    } elseif ($featured) {
        $sql = "SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC";
    } elseif ($category) {
        $sql = "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC";
        $params[] = $category;
        $types .= "s";
    } elseif ($term) {
        $searchTerm = "%".$term."%";
        $sql = "SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "ss";
    } else {
        $sql = "SELECT * FROM products ORDER BY created_at DESC";
    }

    $stmt = mysqli_prepare($link, $sql);
    if ($stmt === false) {
        error_log("PHP GET Error - mysqli_prepare: " . mysqli_error($link) . " SQL: " . $sql);
        send_json_response(['message' => 'Erro ao preparar a consulta SQL (GET).', 'error_details' => mysqli_error($link)], 500);
    }
    if (!empty($params) && !empty($types)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }

    if (!mysqli_stmt_execute($stmt)) {
        error_log("PHP GET Error - mysqli_stmt_execute: " . mysqli_stmt_error($stmt));
        send_json_response(['message' => 'Erro ao executar a consulta SQL (GET).', 'error_details' => mysqli_stmt_error($stmt)], 500);
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

    error_log("PHP POST Request Body: " . $inputJSON);

    if (json_last_error() !== JSON_ERROR_NONE || empty($input) || !isset($input['name'])) {
        error_log("PHP POST Error - JSON Decode ou campos obrigatórios. Erro JSON: " . json_last_error_msg() . ". Input: " . $inputJSON);
        send_json_response(['message' => 'Dados inválidos, JSON malformado ou nome do produto ausente.', 'json_error' => json_last_error_msg(), 'received_input' => $input], 400);
    }

    // Se o ID for AUTO_INCREMENT no MySQL, não defina 'id' aqui e remova-o de $dataToInsert e $columns.
    // Se você gera UUID no PHP ou espera do frontend:
    $input['id'] = $input['id'] ?? generate_uuid_v4_php();
    $dataToInsert = formatProductForDB_PHP($input, false);

    $columns = [];
    $valuesForBind = [];
    $types = "";

    foreach ($dataToInsert as $col => $val) {
        // Não insira 'created_at' se for DEFAULT CURRENT_TIMESTAMP e não vier do payload
        if ($col === 'created_at' && !isset($input['created_at'])) continue;

        $columns[] = "`$col`";
        $valuesForBind[] = $val;
        if (is_int($val)) $types .= "i";
        elseif (is_float($val)) $types .= "d";
        elseif (is_bool($val)) $types .= "i"; // Booleans como inteiros (0 ou 1)
        else $types .= "s";
    }

    if (empty($columns)) {
        send_json_response(['message' => 'Nenhum dado válido para inserir.'], 400);
    }
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO products (" . implode(", ", $columns) . ") VALUES (" . $placeholders . ")";

    error_log("PHP POST - SQL: " . $sql);
    error_log("PHP POST - Types: " . $types);
    error_log("PHP POST - Values for Bind: " . print_r($valuesForBind, true));

    $stmt = mysqli_prepare($link, $sql);
    if ($stmt === false) {
        error_log("PHP POST Error - mysqli_prepare: " . mysqli_error($link));
        send_json_response(['message' => 'Erro ao preparar a consulta SQL (POST).', 'error_details' => mysqli_error($link)], 500);
    }

    if (!empty($types) && count($valuesForBind) == strlen($types)) {
        mysqli_stmt_bind_param($stmt, $types, ...$valuesForBind);
    } else if (!empty($types)) { // Só falha se types não estiver vazio e a contagem não bater
        error_log("PHP POST Error - Discrepância bind_param. Tipos: '$types', Valores: " . count($valuesForBind));
        send_json_response(['message' => 'Erro interno (bind_param POST).'], 500);
    }

    if(mysqli_stmt_execute($stmt)){
        $final_id = $dataToInsert['id']; // Se você gerou/usou UUID
        // $final_id = mysqli_insert_id($link); // Se ID é AUTO_INCREMENT
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
    } else {
        error_log("PHP POST Error - mysqli_stmt_execute: " . mysqli_stmt_error($stmt));
        send_json_response(['message' => 'Erro ao executar a criação do produto.', 'error_details' => mysqli_stmt_error($stmt)], 500);
    }
}
elseif ($method == 'PUT') {
    global $link;
    // ... (similar ao POST, mas com UPDATE e cláusula WHERE id = ?)
    // Certifique-se de que a formatação de dados e o bind_param estão corretos
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json_response(['message' => 'ID do produto é obrigatório para atualização.'], 400);
    }
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);

    if (json_last_error() !== JSON_ERROR_NONE || empty($input)) {
        error_log("PHP PUT Error - JSON Decode ou input vazio. Erro JSON: " . json_last_error_msg() . ". Input: " . $inputJSON);
        send_json_response(['message' => 'Dados inválidos ou JSON malformado para atualização.', 'json_error' => json_last_error_msg()], 400);
    }

    $dataToUpdate = formatProductForDB_PHP($input, true); // true para is_update
    unset($dataToUpdate['id']);
    unset($dataToUpdate['created_at']);

    if (empty($dataToUpdate)) {
        // Se não há nada para atualizar, retorne o produto como está ou um 304.
        $sql_noop = "SELECT * FROM products WHERE id = ?";
        $stmt_noop = mysqli_prepare($link, $sql_noop);
        mysqli_stmt_bind_param($stmt_noop, "s", $id);
        mysqli_stmt_execute($stmt_noop);
        $result_noop = mysqli_stmt_get_result($stmt_noop);
        if ($result_noop && mysqli_num_rows($result_noop) > 0) {
            send_json_response(formatProductFromDB_PHP(mysqli_fetch_assoc($result_noop)), 200); // Ou 304
        } else {
            send_json_response(['message' => 'Produto não encontrado ou nenhum dado alterado.'], 404);
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
        if (is_int($value)) $types .= "i";
        elseif (is_float($value)) $types .= "d";
        elseif (is_bool($value)) $types .= "i";
        else $types .= "s";
    }
    $updateValues[] = $id;
    $types .= 's'; // Para o ID no WHERE

    $sql = "UPDATE products SET " . implode(", ", $setClauses) . " WHERE id = ?";

    error_log("PHP PUT - SQL: " . $sql);
    error_log("PHP PUT - Types: " . $types);
    error_log("PHP PUT - Values: " . print_r($updateValues, true));

    $stmt = mysqli_prepare($link, $sql);
    if ($stmt === false) {
        error_log("PHP PUT Error - mysqli_prepare: " . mysqli_error($link));
        send_json_response(['message' => 'Erro ao preparar a consulta SQL (PUT).', 'error_details' => mysqli_error($link)], 500);
    }
    if (!empty($types) && count($updateValues) == strlen($types)) {
        mysqli_stmt_bind_param($stmt, $types, ...$updateValues);
    } else if (!empty($types)){
        error_log("PHP PUT Error - Discrepância bind_param. Tipos: '$types', Valores: " . count($updateValues));
        send_json_response(['message' => 'Erro interno (bind_param PUT).'], 500);
    }

    if(mysqli_stmt_execute($stmt)){
        $affected_rows = mysqli_stmt_affected_rows($stmt);
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
    } else {
        error_log("PHP PUT Error - mysqli_stmt_execute: " . mysqli_stmt_error($stmt));
        send_json_response(['message' => 'Erro ao executar a atualização do produto.', 'error_details' => mysqli_stmt_error($stmt)], 500);
    }
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
        error_log("PHP DELETE Error - mysqli_prepare: " . mysqli_error($link));
        send_json_response(['message' => 'Erro ao preparar a consulta SQL (DELETE).', 'error_details' => mysqli_error($link)], 500);
    }
    mysqli_stmt_bind_param($stmt, "s", $id);

    if(mysqli_stmt_execute($stmt)){
        if (mysqli_stmt_affected_rows($stmt) > 0) {
            send_json_response(['message' => 'Produto excluído com sucesso.'], 200); // Ou 204
        } else {
            send_json_response(['message' => 'Produto não encontrado para exclusão.'], 404);
        }
    } else {
        error_log("PHP DELETE Error - mysqli_stmt_execute: " . mysqli_stmt_error($stmt));
        send_json_response(['message' => 'Erro ao excluir produto.', 'error_details' => mysqli_stmt_error($stmt)], 500);
    }
    mysqli_stmt_close($stmt);
}
else {
    send_json_response(['message' => 'Método HTTP não permitido.'], 405);
}
?>