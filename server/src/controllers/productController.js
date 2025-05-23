// server/src/controllers/productController.js
const productService = require('../services/mysqlProductService');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Erro em getAllProducts:', error.message);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Produto não encontrado' });
        }
    } catch (error) {
        console.error(`Erro em getProductById para ID ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Erro ao buscar produto', error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;
        // Adicionar validação básica
        if (!productData.name || !productData.price || !productData.category || !productData.stock) {
            return res.status(400).json({ message: 'Campos obrigatórios (name, price, category, stock) não fornecidos.' });
        }
        const newProduct = await productService.createProduct(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro em createProduct:', error.message);
        res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productData = req.body;
        const updatedProduct = await productService.updateProduct(req.params.id, productData);
        if (updatedProduct) {
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Produto não encontrado para atualização' });
        }
    } catch (error) {
        console.error(`Erro em updateProduct para ID ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);
        if (result.affectedRows > 0) {
             res.status(200).json({ message: 'Produto excluído com sucesso' });
        } else {
             res.status(404).json({ message: 'Produto não encontrado para exclusão' });
        }
    } catch (error) {
        console.error(`Erro em deleteProduct para ID ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Erro ao excluir produto', error: error.message });
    }
};

exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await productService.getFeaturedProducts();
        res.json(products);
    } catch (error) {
        console.error('Erro em getFeaturedProducts:', error.message);
        res.status(500).json({ message: 'Erro ao buscar produtos em destaque', error: error.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const products = await productService.getProductsByCategory(req.params.category);
        res.json(products);
    } catch (error) {
        console.error(`Erro em getProductsByCategory para categoria ${req.params.category}:`, error.message);
        res.status(500).json({ message: 'Erro ao buscar produtos por categoria', error: error.message });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const searchTerm = req.query.term;
        if (!searchTerm) {
            return res.status(400).json({ message: 'Termo de busca é obrigatório' });
        }
        const products = await productService.searchProducts(searchTerm);
        res.json(products);
    } catch (error) {
        console.error(`Erro em searchProducts para termo ${req.query.term}:`, error.message);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
};