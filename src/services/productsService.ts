// src/services/productsService.ts
import { Product, ProductFormData, SpecificationItem } from '@/types/Product';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Ex: http://localhost/seu_projeto_php/api

const parseDate = (dateInput: string | Date | undefined | null): Date => {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
  }
  return new Date();
};

const formatProductFromAPI = (apiProduct: any): Product => {
    // console.log("Raw from API (PHP):", apiProduct); // Log para depuração
    try {
        return {
            id: apiProduct.id,
            name: apiProduct.name,
            description: apiProduct.description,
            price: parseFloat(apiProduct.price) || 0,
            category: apiProduct.category,
            imageUrl: apiProduct.imageUrl, // PHP retorna 'imageUrl'
            stock: parseInt(apiProduct.stock, 10) || 0,
            featured: Boolean(apiProduct.featured), // PHP bool(true) é 1, bool(false) é 0 ou ''
            discount: parseInt(apiProduct.discount || 0, 10),
            createdAt: parseDate(apiProduct.createdAt),
            descriptionImages: Array.isArray(apiProduct.descriptionImages) ? apiProduct.descriptionImages : [],
            specificationImages: Array.isArray(apiProduct.specificationImages) ? apiProduct.specificationImages : [],
            deliveryImages: Array.isArray(apiProduct.deliveryImages) ? apiProduct.deliveryImages : [],
            allowCustomization: Boolean(apiProduct.allowCustomization),
            allowCustomName: Boolean(apiProduct.allowCustomName),
            allowCustomModality: Boolean(apiProduct.allowCustomModality),
            allowCustomColorSelection: Boolean(apiProduct.allowCustomColorSelection),
            colors: Array.isArray(apiProduct.colors) ? apiProduct.colors : [],
            specifications: Array.isArray(apiProduct.specifications) ? apiProduct.specifications : [],
        };
    } catch (e) {
        console.error("Frontend: Erro ao formatar produto da API:", apiProduct, e);
        return { /* estrutura de fallback robusta */ } as Product;
    }
};

const formatProductForAPI = (product: ProductFormData | Product): any => {
    const dataForAPI: any = {
        name: product.name,
        description: product.description,
        price: Number(product.price),
        category: product.category,
        stock: Number(product.stock),
        // O PHP espera image_url (snake_case) mas formatProductForDB_PHP pode lidar com imageUrl
        image_url: product.imageUrl,
        featured: product.featured ? 1 : 0, // PHP/MySQL espera 0 ou 1 para boolean
        discount: Number(product.discount || 0),
        // O PHP espera strings JSON para estes campos
        description_images: JSON.stringify(product.descriptionImages || []),
        specification_images: JSON.stringify(product.specificationImages || []),
        delivery_images: JSON.stringify(product.deliveryImages || []),
        allow_customization: product.allowCustomization ? 1 : 0,
        allowcustomname: product.allowCustomName ? 1 : 0, // Nomes de colunas como no BD/PHP
        allowcustommodality: product.allowCustomModality ? 1 : 0,
        allowcustomcolorselection: product.allowCustomColorSelection ? 1 : 0,
        colors: JSON.stringify(product.colors || []),
        specifications: JSON.stringify(product.specifications || []),
    };
    // Se o ID for gerado pelo frontend (UUID), envie-o. Se for AUTO_INCREMENT, não envie para create.
    if ('id' in product && product.id) {
        dataForAPI.id = product.id;
    }

    Object.keys(dataForAPI).forEach(key => {
        if (dataForAPI[key] === undefined) delete dataForAPI[key];
    });
    return dataForAPI;
};

// --- Funções CRUD e outras ---

export const getAllProducts = async (): Promise<Product[]> => {
    const url = `${API_BASE_URL}/products.php`;
    console.log("Frontend: getAllProducts de:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Frontend (getAllProducts) - Resposta não OK:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 300)}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error("Frontend (getAllProducts) - Resposta não é array:", data);
            throw new Error('A resposta da API para getAllProducts não é um array.');
        }
        return data.map(formatProductFromAPI);
    } catch (err: any) {
        console.error('Frontend: Falha ao buscar todos os produtos:', err.message, err);
        throw err;
    }
};

// ... (getProductById, createProduct, updateProduct, deleteProduct, searchProducts, getProductsByCategory, getFeaturedProducts)
// Devem seguir o mesmo padrão de logging e tratamento de erro.
// Exemplo para createProduct:

export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
    const dataToSend = formatProductForAPI(productFormData);
    const url = `${API_BASE_URL}/products.php`;
    console.log("Frontend: createProduct para:", url, "com dados:", dataToSend);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });
        if (!response.ok) {
            let errorPayload = { message: `Server error ${response.status}: ${response.statusText}` };
            try {
                errorPayload = await response.json();
            } catch (e) {
                const textError = await response.text();
                errorPayload.message = textError || errorPayload.message;
                console.error("Frontend (createProduct) - Resposta de erro não JSON:", textError);
            }
            console.error("Frontend (createProduct) - Resposta não OK:", errorPayload);
            throw new Error(`HTTP error! status: ${response.status} - ${errorPayload.message || 'Erro desconhecido ao criar produto'}`);
        }
        const data = await response.json();
        return formatProductFromAPI(data);
    } catch (err: any) {
        console.error('Frontend: Falha ao criar produto:', err.message, err);
        throw err;
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const url = `${API_BASE_URL}/products.php?id=${encodeURIComponent(id)}`;
    console.log("Frontend: getProductById de:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) return null;
            const errorText = await response.text();
            console.error("Frontend (getProductById) - Resposta não OK:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0,300)}`);
        }
        const data = await response.json();
        return data ? formatProductFromAPI(data) : null;
    } catch (err: any) {
        console.error(`Frontend: Falha ao buscar produto por ID (${id}):`, err.message);
        throw err;
    }
};


export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
    const dataToSend = formatProductForAPI(productFormData);
    const url = `${API_BASE_URL}/products.php?id=${encodeURIComponent(id)}`;
    console.log("Frontend: updateProduct para:", url, "com dados:", dataToSend);
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });
        if (!response.ok) {
            let errorPayload = { message: `Server error ${response.status}: ${response.statusText}` };
            try { errorPayload = await response.json(); } catch (e) {
                const textError = await response.text();
                errorPayload.message = textError || errorPayload.message;
                console.error("Frontend (updateProduct) - Resposta de erro não JSON:", textError);
            }
            console.error("Frontend (updateProduct) - Resposta não OK:", errorPayload);
            throw new Error(`HTTP error! status: ${response.status} - ${errorPayload.message || 'Erro desconhecido ao atualizar'}`);
        }
        const data = await response.json();
        return formatProductFromAPI(data);
    } catch (err: any) {
        console.error(`Frontend: Falha ao atualizar produto (ID: ${id}):`, err.message);
        throw err;
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    const url = `${API_BASE_URL}/products.php?id=${encodeURIComponent(id)}`;
    console.log("Frontend: deleteProduct para:", url);
    try {
        const response = await fetch(url, {
            method: 'DELETE',
        });
        if (!response.ok) {
            let errorPayload = { message: `Server error ${response.status}: ${response.statusText}` };
            try { errorPayload = await response.json(); } catch (e) {
                const textError = await response.text();
                errorPayload.message = textError || errorPayload.message;
                 console.error("Frontend (deleteProduct) - Resposta de erro não JSON:", textError);
            }
            console.error("Frontend (deleteProduct) - Resposta não OK:", errorPayload);
            throw new Error(`HTTP error! status: ${response.status} - ${errorPayload.message || 'Erro desconhecido ao deletar'}`);
        }
        // DELETE bem-sucedido geralmente não tem corpo ou tem uma mensagem simples
        console.log(`Produto ${id} deletado com sucesso.`);
    } catch (err: any) {
        console.error(`Frontend: Falha ao deletar produto (ID: ${id}):`, err.message);
        throw new Error(`Falha ao deletar produto: ${err.message}`.trim());
    }
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    const url = `${API_BASE_URL}/products.php?term=${encodeURIComponent(searchTerm)}`;
    console.log("Frontend: searchProducts de:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
             console.error("Frontend (searchProducts) - Resposta não OK:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0,300)}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
             console.error("Frontend (searchProducts) - Resposta não é array:", data);
            throw new Error('A resposta da API para searchProducts não é um array.');
        }
        return data.map(formatProductFromAPI);
    } catch (err: any) {
        console.error('Frontend: Falha ao buscar produtos:', err.message);
        return [];
    }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
    const url = `${API_BASE_URL}/products.php?category=${encodeURIComponent(category)}`;
    console.log("Frontend: getProductsByCategory de:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
             console.error("Frontend (getProductsByCategory) - Resposta não OK:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0,300)}`);
        }
        const data = await response.json();
         if (!Array.isArray(data)) {
             console.error("Frontend (getProductsByCategory) - Resposta não é array:", data);
            throw new Error('A resposta da API para getProductsByCategory não é um array.');
        }
        return data.map(formatProductFromAPI);
    } catch (err: any) {
        console.error('Frontend: Falha ao buscar produtos por categoria:', err.message);
        return [];
    }
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
    const url = `${API_BASE_URL}/products.php?featured=true`;
    console.log("Frontend: getFeaturedProducts de:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Frontend (getFeaturedProducts) - Resposta não OK:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0,300)}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error("Frontend (getFeaturedProducts) - Resposta não é array:", data);
            throw new Error('A resposta da API para getFeaturedProducts não é um array.');
        }
        return data.map(formatProductFromAPI);
    } catch (err: any) {
        console.error('Frontend: Falha ao buscar produtos em destaque:', err.message);
        return [];
    }
};