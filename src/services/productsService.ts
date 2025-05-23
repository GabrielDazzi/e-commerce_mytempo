// src/services/productsService.ts
import { Product, ProductFormData, SpecificationItem } from '@/types/Product';

// Defina VITE_API_BASE_URL no seu arquivo .env na raiz do projeto frontend
// Ex: VITE_API_BASE_URL=http://localhost:3001/api (para desenvolvimento)
// Em produção, será a URL da sua API deployada.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/products'; // O '/api/products' já é o prefixo das rotas

// Função para parsear datas (pode ser mantida como está)
const parseDate = (dateInput: string | Date | undefined | null): Date => {
  if (dateInput instanceof Date) {
      return dateInput;
    }
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  };

// Função para formatar dados vindos da API para o tipo Product do frontend
const formatProductFromAPI = (apiProduct: any): Product => {
    // A API Node.js/Express pode retornar snake_case, então convertemos para camelCase
    // e fazemos o parse de campos JSON que podem vir como string.
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        description: apiProduct.description,
        price: parseFloat(apiProduct.price),
        category: apiProduct.category,
        imageUrl: apiProduct.image_url || apiProduct.imageUrl, // Considerar ambos os cases
        stock: parseInt(apiProduct.stock, 10),
        featured: Boolean(apiProduct.featured),
        discount: parseInt(apiProduct.discount || 0, 10),
        createdAt: parseDate(apiProduct.created_at || apiProduct.createdAt),
        descriptionImages: Array.isArray(apiProduct.description_images) ? apiProduct.description_images : (typeof apiProduct.description_images === 'string' ? JSON.parse(apiProduct.description_images || '[]') : []),
        specificationImages: Array.isArray(apiProduct.specification_images) ? apiProduct.specification_images : (typeof apiProduct.specification_images === 'string' ? JSON.parse(apiProduct.specification_images || '[]') : []),
        deliveryImages: Array.isArray(apiProduct.delivery_images) ? apiProduct.delivery_images : (typeof apiProduct.delivery_images === 'string' ? JSON.parse(apiProduct.delivery_images || '[]') : []),
        allowCustomization: Boolean(apiProduct.allow_customization || apiProduct.allowCustomization),
        allowCustomName: Boolean(apiProduct.allowcustomname || apiProduct.allowCustomName),
        allowCustomModality: Boolean(apiProduct.allowcustommodality || apiProduct.allowCustomModality),
        allowCustomColorSelection: Boolean(apiProduct.allowcustomcolorselection || apiProduct.allowCustomColorSelection),
        colors: Array.isArray(apiProduct.colors) ? apiProduct.colors : (typeof apiProduct.colors === 'string' ? JSON.parse(apiProduct.colors || '[]') : []),
        specifications: Array.isArray(apiProduct.specifications) ? apiProduct.specifications : (typeof apiProduct.specifications === 'string' ? JSON.parse(apiProduct.specifications || '[]') : []),
    };
};

// Função para formatar dados do frontend para enviar para a API Node.js/Express
const formatProductForAPI = (product: ProductFormData | Product): any => {
    // Converte para snake_case se sua API espera esse formato e serializa JSON
    const dataForAPI: any = {
        name: product.name,
        description: product.description,
        price: Number(product.price),
        category: product.category,
        stock: Number(product.stock),
        image_url: product.imageUrl, // Exemplo: snake_case
        featured: product.featured,
        discount: Number(product.discount || 0),
        description_images: JSON.stringify(product.descriptionImages || []),
        specification_images: JSON.stringify(product.specificationImages || []),
        delivery_images: JSON.stringify(product.deliveryImages || []),
        allow_customization: product.allowCustomization, // snake_case
        allowcustomname: product.allowCustomName, // Mantém camelCase se a API/BD usar assim
        allowcustommodality: product.allowCustomModality,
        allowcustomcolorselection: product.allowCustomColorSelection,
        colors: JSON.stringify(product.colors || []),
        specifications: JSON.stringify(product.specifications || []),
        // created_at geralmente é gerenciado pelo banco de dados no insert
    };
    if (product.createdAt instanceof Date) {
        // dataForAPI.created_at = product.createdAt.toISOString(); // Se for enviar para API
    }


    // Se for um produto existente (tem ID), pode ser necessário enviar o ID
    // No entanto, para POST (criar), o ID geralmente não é enviado.
    // Para PUT (atualizar), o ID está na URL.
    if ('id' in product && product.id) {
        // Não precisa adicionar 'id' ao corpo para PUT, já está na URL.
        // Para POST, o backend pode gerar.
    }

    // Remove chaves indefinidas
    Object.keys(dataForAPI).forEach(key => {
        if (dataForAPI[key] === undefined) {
        delete dataForAPI[key];
        }
    });
    return dataForAPI;
};


export const getAllProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}`); // API_BASE_URL já inclui /products
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return (data || []).map(formatProductFromAPI);
    } catch (err) {
        console.error('Failed to fetch all products:', err);
        throw err; // Ou retorne um array vazio/mock data
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data ? formatProductFromAPI(data) : null;
    } catch (err) {
        console.error(`Failed to fetch product by ID (${id}):`, err);
        throw err;
    }
};

export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
    const dataToSend = formatProductForAPI(productFormData);
    try {
        const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
        }
        const data = await response.json();
        return formatProductFromAPI(data);
    } catch (err) {
        console.error('Failed to create product:', err);
        throw err;
    }
};

export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
    const dataToSend = formatProductForAPI(productFormData);
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
        }
        const data = await response.json();
        return formatProductFromAPI(data);
    } catch (err) {
        console.error(`Failed to update product (ID: ${id}):`, err);
        throw err;
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
        }
    } catch (err: any) {
        console.error(`Failed to delete product (ID: ${id}):`, err);
        const message = err.message || 'Ocorreu um erro desconhecido.';
        throw new Error(`Falha ao deletar produto: ${message}`.trim());
    }
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/search?term=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        return (data || []).map(formatProductFromAPI);
    } catch (err) {
        console.error('Failed to search products:', err);
        return [];
    }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/category/${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        return (data || []).map(formatProductFromAPI);
    } catch (err) {
        console.error('Failed to fetch products by category:', err);
        return [];
    }
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/featured`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        return (data || []).map(formatProductFromAPI);
    } catch (err) {
        console.error('Failed to fetch featured products:', err);
        return [];
    }
};