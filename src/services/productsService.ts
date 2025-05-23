// src/services/productsService.ts
// ... (imports e parseDate como antes) ...
import { Product, ProductFormData, SpecificationItem } from '@/types/Product'; // Adicionado SpecificationItem

// ...

const formatProductForDB = (product: ProductFormData | Product): any => {
  let createdAtISO: string;
  if (product.createdAt instanceof Date) {
    createdAtISO = product.createdAt.toISOString();
  } else if (typeof product.createdAt === 'string' && product.createdAt) {
    try {
      createdAtISO = new Date(product.createdAt).toISOString();
    } catch (e) {
      console.warn('Invalid createdAt string, using current date:', product.createdAt);
      createdAtISO = new Date().toISOString();
    }
  } else {
    createdAtISO = new Date().toISOString(); // Para novos produtos, ou se não fornecido
  }

  const dataForSupabase: any = {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock),
    // createdat: createdAtISO, // Considerar se deve ser enviado sempre
    imageurl: product.imageUrl,
    featured: product.featured,
    discount: Number(product.discount || 0),
    descriptionimages: product.descriptionImages,
    specificationimages: product.specificationImages,
    deliveryimages: product.deliveryImages,
    allowcustomization: product.allowCustomization,
    colors: product.colors,
    specifications: product.specifications || [], // NOVO CAMPO
  };

  // Se for um novo produto e a coluna createdat tem DEFAULT, pode omitir.
  // Se for atualização, geralmente não se atualiza createdat.
  if (!('id'in product) || !product.id) { // Se é um novo produto (não tem id)
    dataForSupabase.createdat = createdAtISO;
  }


  Object.keys(dataForSupabase).forEach(key => {
    if (dataForSupabase[key] === undefined) {
      delete dataForSupabase[key];
    }
  });

  return dataForSupabase;
};

const formatProductFromDB = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: isNaN(Number(dbProduct.price)) ? 0 : Number(dbProduct.price),
    category: dbProduct.category,
    imageUrl: dbProduct.imageurl,
    stock: isNaN(Number(dbProduct.stock)) ? 0 : Number(dbProduct.stock),
    featured: dbProduct.featured || false,
    discount: isNaN(Number(dbProduct.discount)) ? 0 : Number(dbProduct.discount || 0),
    createdAt: parseDate(dbProduct.createdat),
    descriptionImages: dbProduct.descriptionimages || [],
    specificationImages: dbProduct.specificationimages || [],
    deliveryImages: dbProduct.deliveryimages || [],
    allowCustomization: dbProduct.allowcustomization || false,
    colors: dbProduct.colors || [],
    specifications: dbProduct.specifications || [], // NOVO CAMPO - Supabase retorna JSONB como objeto/array JS
  };
};

// Mock data com o novo campo specifications
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Troféu de Ouro Mock',
        description: 'Troféu de ouro para premiações esportivas (mock)',
        price: 129.99,
        category: 'trofeus',
        imageUrl: '/placeholder.svg',
        stock: 15,
        featured: true,
        discount: 10,
        createdAt: new Date(),
        descriptionImages: [],
        specificationImages: [],
        deliveryImages: [],
        allowCustomization: true,
        colors: ['gold', 'silver'],
        specifications: [{name: "Material Mock", value: "Plástico ABS"}, {name: "Altura Mock", value: "30cm"}], // Exemplo
      },
      {
        id: '2',
        name: 'Porta Medalhas Mock',
        description: 'Porta medalhas personalizável (mock)',
        price: 89.99,
        category: 'porta-medalhas',
        imageUrl: '/placeholder.svg',
        stock: 8,
        featured: false,
        discount: 0,
        createdAt: new Date(),
        descriptionImages: [],
        specificationImages: [],
        deliveryImages: [],
        allowCustomization: true,
        colors: ['black', 'white'],
        specifications: [{name: "Capacidade Mock", value: "Aprox. 30 medalhas"}], // Exemplo
      }
];


// createProduct e updateProduct também precisam lidar com o campo specifications.
// A lógica de formatProductForDB e formatProductFromDB já cobre isso,
// então as funções de CRUD (create, update, get) não precisam de grandes mudanças
// além de garantir que o campo 'specifications' seja selecionado (*) e passado.

// ... (resto das funções como getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, etc.)
// Elas devem funcionar corretamente se 'select *' for usado e as funções de formatação
// estiverem corretas.

// Exemplo de como createProduct e updateProduct usariam os dados já formatados:
export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
    console.log("productsService: createProduct com (form data):", productFormData);
    if (!isSupabaseConfigured()) {
      // ... (lógica de mock com o novo campo specifications)
      const newProduct: Product = {
            id: `mock-${Date.now()}`,
            ...productFormData, // Spread do productFormData
            price: Number(productFormData.price), // Garante que números sejam números
            stock: Number(productFormData.stock),
            discount: Number(productFormData.discount || 0),
            createdAt: productFormData.createdAt || new Date(),
            specifications: productFormData.specifications || [], // Adiciona specifications
        };
        mockProducts.push(newProduct);
        return Promise.resolve(newProduct);
    }

    const finalProductDataForDB = formatProductForDB(productFormData);
    console.log("productsService: Enviando para Supabase (create):", finalProductDataForDB);

    try {
        const { data, error } = await supabase
            .from(PRODUCTS_TABLE)
            .insert(finalProductDataForDB)
            .select()
            .single();
        // ... (resto da função)
        if (error) { /* ... */ throw error; }
        return formatProductFromDB(data);
    } catch (err: any) { /* ... */ throw err; }
};

export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
    console.log(`productsService: updateProduct (ID: ${id}) com (form data):`, productFormData);
     if (!isSupabaseConfigured()) {
        // ... (lógica de mock com o novo campo specifications)
        const index = mockProducts.findIndex(p => p.id === id);
        if (index >= 0) {
            const updatedMockProduct: Product = {
                ...mockProducts[index],
                ...productFormData,
                price: Number(productFormData.price),
                stock: Number(productFormData.stock),
                discount: Number(productFormData.discount || 0),
                createdAt: productFormData.createdAt || mockProducts[index].createdAt,
                specifications: productFormData.specifications || mockProducts[index].specifications, // Adiciona specifications
            };
            mockProducts[index] = updatedMockProduct;
            return Promise.resolve(updatedMockProduct);
        }
        throw new Error('Produto mock não encontrado para atualização');
    }

    const finalProductDataForDB = formatProductForDB(productFormData);
     // Para UPDATE, você pode querer remover `createdat` para não tentar atualizá-lo
    if (finalProductDataForDB.createdat) {
        delete finalProductDataForDB.createdat;
    }
    console.log(`productsService: Enviando para Supabase (update ID: ${id}):`, finalProductDataForDB);

    try {
        const { data, error } = await supabase
            .from(PRODUCTS_TABLE)
            .update(finalProductDataForDB)
            .eq('id', id)
            .select()
            .single();
        // ... (resto da função)
         if (error) { /* ... */ throw error; }
        return formatProductFromDB(data);
    } catch (err: any) { /* ... */ throw err; }
};

// As demais funções (getAllProducts, getProductById, deleteProduct, etc.) devem continuar funcionando
// pois o `select('*')` já trará o novo campo `specifications` e `formatProductFromDB` o processará.

// (Cole o restante das funções getAllProducts, getProductById, deleteProduct, searchProducts, getProductsByCategory, getFeaturedProducts aqui, elas não precisam de alteração na lógica principal devido ao `formatProductFromDB` e `select('*')`)
export const getAllProducts = async (): Promise<Product[]> => {
  console.log("productsService: getAllProducts iniciado");
  if (!isSupabaseConfigured()) {
    console.log('productsService: Usando mock data para getAllProducts');
    return Promise.resolve([...mockProducts]);
  }

  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('productsService: Erro ao buscar produtos no Supabase:', error);
      throw error;
    }
    console.log("productsService: Produtos buscados do Supabase (raw):", data);
    return (data || []).map(formatProductFromDB);
  } catch (err) {
    console.error('productsService: Falha ao buscar produtos (catch):', err);
    if (err instanceof Error) {
        throw err;
    }
    throw new Error('Falha desconhecida ao buscar produtos');
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  console.log(`productsService: getProductById (ID: ${id}) iniciado`);
  if (!isSupabaseConfigured()) {
    const product = mockProducts.find(p => p.id === id);
    console.log(`productsService: Usando mock data para getProductById (ID: ${id}):`, product);
    return product ? Promise.resolve(product) : Promise.resolve(null);
  }

  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`productsService: Erro ao buscar produto por ID (${id}) no Supabase:`, error);
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    console.log(`productsService: Produto por ID (${id}) buscado do Supabase (raw):`, data);
    return data ? formatProductFromDB(data) : null;
  } catch (err) {
    console.error(`productsService: Falha ao buscar produto por ID (${id}) (catch):`, err);
     if (err instanceof Error) {
        throw err;
    }
    throw new Error(`Falha desconhecida ao buscar produto por ID ${id}`);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  console.log(`productsService: deleteProduct (ID: ${id}) iniciado`);
  if (!isSupabaseConfigured()) {
    const initialLength = mockProducts.length;
    const index = mockProducts.findIndex(p => p.id === id);
    if (index > -1) {
        mockProducts.splice(index, 1);
    }
    console.log(`productsService: Usando mock data para deletar produto (ID: ${id}). Mock products length changed: ${initialLength !== mockProducts.length}`);
    return Promise.resolve();
  }

  try {
    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`productsService: Erro ao deletar produto (ID: ${id}) no Supabase:`, error);
      throw error;
    }
    console.log(`productsService: Produto (ID: ${id}) deletado no Supabase com sucesso`);
  } catch (err: any) {
    console.error(`productsService: Falha ao deletar produto (ID: ${id}) (catch global):`, err);
    const message = err.message || 'Ocorreu um erro desconhecido.';
    throw new Error(`Falha ao deletar produto: ${message}`.trim());
  }
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('createdat', { ascending: false });
    if (error) throw error;
    return (data || []).map(formatProductFromDB);
  } catch (err) {
    console.error('Failed to search products:', err);
    return [];
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
    if (!isSupabaseConfigured()) return mockProducts.filter(product => product.category === category);
    try {
        const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .eq('category', category)
        .order('createdat', { ascending: false });
        if (error) throw error;
        return (data || []).map(formatProductFromDB);
    } catch (err) {
        console.error('Failed to fetch products by category:', err);
        return [];
    }
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
    if (!isSupabaseConfigured()) return mockProducts.filter(product => product.featured);
    try {
        const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .eq('featured', true)
        .order('createdat', { ascending: false });
        if (error) throw error;
        return (data || []).map(formatProductFromDB);
    } catch (err) {
        console.error('Failed to fetch featured products:', err);
        return [];
    }
};