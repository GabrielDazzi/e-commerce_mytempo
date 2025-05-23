// server/src/services/mysqlProductService.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ... (formatProductFromDB e formatProductForDBWrite como na resposta anterior) ...
const formatProductFromDB = (dbProduct) => {
    if (!dbProduct) return null;
    try {
        return {
            id: dbProduct.id,
            name: dbProduct.name,
            description: dbProduct.description,
            price: parseFloat(dbProduct.price),
            category: dbProduct.category,
            imageUrl: dbProduct.image_url,
            stock: parseInt(dbProduct.stock, 10),
            featured: Boolean(dbProduct.featured),
            discount: parseInt(dbProduct.discount || 0, 10),
            createdAt: dbProduct.created_at,
            descriptionImages: dbProduct.description_images ? JSON.parse(dbProduct.description_images) : [],
            specificationImages: dbProduct.specification_images ? JSON.parse(dbProduct.specification_images) : [],
            deliveryImages: dbProduct.delivery_images ? JSON.parse(dbProduct.delivery_images) : [],
            allowCustomization: Boolean(dbProduct.allow_customization),
            allowCustomName: Boolean(dbProduct.allowcustomname), // Corrigido para corresponder ao BD (sem underscore)
            allowCustomModality: Boolean(dbProduct.allowcustommodality), // Corrigido
            allowCustomColorSelection: Boolean(dbProduct.allowcustomcolorselection), // Corrigido
            colors: dbProduct.colors ? JSON.parse(dbProduct.colors) : [],
            specifications: dbProduct.specifications ? JSON.parse(dbProduct.specifications) : [],
        };
    } catch (e) {
        console.error("Erro ao parsear JSON do BD para produto:", dbProduct.id, e);
        return {
            ...dbProduct, // Retorna os campos crus se o parse JSON falhar para algum
            price: parseFloat(dbProduct.price),
            stock: parseInt(dbProduct.stock, 10),
            featured: Boolean(dbProduct.featured),
            discount: parseInt(dbProduct.discount || 0, 10),
            descriptionImages: [],
            specificationImages: [],
            deliveryImages: [],
            colors: [],
            specifications: [],
        };
    }
};

const formatProductForDBWrite = (productData) => {
    const data = { ...productData };

    data.image_url = data.imageUrl !== undefined ? data.imageUrl : null; delete data.imageUrl;
    // Assegure que os arrays sejam stringificados, e que campos ausentes resultem em '[]'
    data.description_images = JSON.stringify(data.descriptionImages || []); delete data.descriptionImages;
    data.specification_images = JSON.stringify(data.specificationImages || []); delete data.specificationImages;
    data.delivery_images = JSON.stringify(data.deliveryImages || []); delete data.deliveryImages;

    data.allow_customization = data.allowCustomization !== undefined ? Boolean(data.allowCustomization) : false;
    // Nomes das colunas no BD para as novas flags (assumindo que são como definidas no SQL, sem underscore)
    data.allowcustomname = data.allowCustomName !== undefined ? Boolean(data.allowCustomName) : false;
    data.allowcustommodality = data.allowCustomModality !== undefined ? Boolean(data.allowCustomModality) : false;
    data.allowcustomcolorselection = data.allowCustomColorSelection !== undefined ? Boolean(data.allowCustomColorSelection) : false;

    // Remova as chaves camelCase originais se elas existirem após a atribuição às chaves snake_case/lowercase
    delete data.allowCustomization;
    delete data.allowCustomName;
    delete data.allowCustomModality;
    delete data.allowCustomColorSelection;

    data.colors = JSON.stringify(data.colors || []);
    data.specifications = JSON.stringify(data.specifications || []);

    data.featured = data.featured !== undefined ? Boolean(data.featured) : false;
    data.price = data.price !== undefined ? parseFloat(data.price) : 0;
    data.stock = data.stock !== undefined ? parseInt(data.stock, 10) : 0;
    data.discount = data.discount !== undefined ? parseInt(data.discount, 10) : 0;

    delete data.createdAt; // O BD gerencia isso com DEFAULT CURRENT_TIMESTAMP

    // Filtrar apenas os campos que existem na tabela e remover undefined
    const dbColumns = [
        'id', 'name', 'description', 'price', 'category', 'image_url', 'stock',
        'featured', 'discount', /*'created_at' é DEFAULT*/ 'description_images',
        'specification_images', 'delivery_images', 'allow_customization',
        'allowcustomname', 'allowcustommodality', 'allowcustomcolorselection',
        'colors', 'specifications'
    ];

    const finalData = {};
    for (const key in data) {
        if (dbColumns.includes(key) && data[key] !== undefined) {
            finalData[key] = data[key];
        } else if (dbColumns.includes(key.toLowerCase()) && data[key] !== undefined) { // Tenta com lowercase para mapeamento
            finalData[key.toLowerCase()] = data[key];
        }
    }
    // Se o ID for gerado aqui e não existir em productData, adicione-o
    if (!finalData.id && productData.id) { // Se o ID foi passado em productData
        finalData.id = productData.id;
    } else if (!finalData.id) { // Se nenhum ID foi passado, e você gera UUIDs aqui
        finalData.id = uuidv4();
    }


    return finalData;
};


const getAllProducts = async () => {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return rows.map(formatProductFromDB);
};

const getProductById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows.length ? formatProductFromDB(rows[0]) : null;
};

const createProduct = async (productDataFromController) => {
    // Garante que um ID exista (gerado aqui se não vier do controller/frontend)
    const productWithId = { id: productDataFromController.id || uuidv4(), ...productDataFromController };
    const dataToInsert = formatProductForDBWrite(productWithId);

    // Filtra chaves undefined e 'created_at' que é DEFAULT no BD
    const columns = Object.keys(dataToInsert).filter(key => key !== 'created_at' && dataToInsert[key] !== undefined);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => dataToInsert[col]);

    if (columns.length === 0) {
        throw new Error("Nenhuma coluna válida para inserir.");
    }

    // Uso de ` ` (backticks) para envolver nomes de colunas é uma boa prática no MySQL se houver palavras reservadas ou caracteres especiais
    // No entanto, se os nomes das colunas são simples, não é estritamente necessário.
    // O problema original era a interpolação da string, não os backticks.
    const sql = `INSERT INTO products (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;

    console.log("SQL para INSERT:", sql);
    console.log("Valores para INSERT:", JSON.stringify(values, null, 2));
    console.log("Objeto dataToInsert (formatado):", JSON.stringify(dataToInsert, null, 2));

    await pool.query(sql, values);
    return getProductById(dataToInsert.id); // Usa o ID que foi para o BD
};

const updateProduct = async (id, productDataFromController) => {
    const dataToUpdate = formatProductForDBWrite(productDataFromController);
    delete dataToUpdate.id; // ID não deve ser atualizado no SET, é usado no WHERE
    delete dataToUpdate.created_at; // Não se atualiza created_at

    const validColumnsToUpdate = Object.keys(dataToUpdate).filter(key => dataToUpdate[key] !== undefined);

    if (validColumnsToUpdate.length === 0) {
        console.warn(`Nenhum dado para atualizar para o produto ID: ${id}`);
        return getProductById(id); // Retorna o produto como está se não houver o que atualizar
    }

    const fields = validColumnsToUpdate.map(key => `\`${key}\` = ?`).join(', '); // Envolver nomes de colunas com backticks
    const values = validColumnsToUpdate.map(key => dataToUpdate[key]);
    values.push(id); // Adiciona o ID para a cláusula WHERE

    const sql = `UPDATE products SET ${fields} WHERE id = ?`;

    console.log("SQL para UPDATE:", sql);
    console.log("Valores para UPDATE:", JSON.stringify(values, null, 2));

    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) {
        return null;
    }
    return getProductById(id);
};

const deleteProduct = async (id) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    // result.affectedRows indicará se alguma linha foi deletada
    return result;
};

const getFeaturedProducts = async () => {
    const [rows] = await pool.query('SELECT * FROM products WHERE featured = TRUE ORDER BY created_at DESC');
    return rows.map(formatProductFromDB);
};

const getProductsByCategory = async (category) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC', [category]);
    return rows.map(formatProductFromDB);
};

const searchProducts = async (searchTerm) => {
    const query = `
        SELECT * FROM products
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
    `;
    const term = `%${searchTerm}%`;
    const [rows] = await pool.query(query, [term, term]);
    return rows.map(formatProductFromDB);
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductsByCategory,
    searchProducts
};