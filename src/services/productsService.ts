import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types/Product';

const PRODUCTS_TABLE = 'products';

const parseDate = (dateString: string | null): Date => {
  return dateString ? new Date(dateString) : new Date();
};

// Formata o produto ANTES de enviar para o DB
const formatProductForDB = (product: ProductFormData | Product): any => { // Retorna 'any' para flexibilidade, mas será estruturado
  let createdatISO: string;

  if (product.createdat instanceof Date) {
    createdatISO = product.createdat.toISOString();
  } else if (typeof product.createdat === 'string' && product.createdat) {
    try {
      createdatISO = new Date(product.createdat).toISOString();
    } catch (e) {
      console.warn('Invalid createdat string, using current date:', product.createdat);
      createdatISO = new Date().toISOString();
    }
  } else {
    createdatISO = new Date().toISOString();
  }

  // Objeto a ser enviado para o Supabase.
  // O cliente Supabase (supabase-js) tentará mapear chaves camelCase do JS
  // para colunas snake_case ou lowercase no PostgreSQL.
  // Ex: JS `imageUrl` -> DB `imageurl` ou `image_url`.
  // Para evitar ambiguidades com o erro do schema_cache, vamos ser explícitos
  // e usar chaves minúsculas aqui se as colunas do DB forem minúsculas.
  const dataForSupabase: any = {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock),
    createdat: createdatISO, // Coluna do DB é 'createdat'
    // Campos opcionais: só incluir se tiverem valor
    ...(product.imageurl && { imageurl: product.imageurl }), // Coluna do DB é 'imageurl'
    ...(product.featured !== undefined && { featured: product.featured }),
    ...(product.discount !== undefined && { discount: Number(product.discount || 0) }),
    ...(product.descriptionimages && { descriptionimages: product.descriptionimages }), // Coluna 'descriptionimages'
    ...(product.specificationimages && { specificationimages: product.specificationimages }), // Coluna 'specificationimages'
    ...(product.deliveryimages && { deliveryimages: product.deliveryimages }), // Coluna 'deliveryimages'
    ...(product.allowcustomization !== undefined && { allowcustomization: product.allowcustomization }), // Coluna 'allowcustomization'
    ...(product.colors && { colors: product.colors }),
  };

  // Remove chaves com valor undefined do objeto final
  Object.keys(dataForSupabase).forEach(key => {
    if (dataForSupabase[key] === undefined) {
      delete dataForSupabase[key];
    }
  });

  return dataForSupabase;
};


// Formata o produto APÓS receber do DB
const formatProductFromDB = (dbProduct: any): Product => {
  // Assume que as colunas do DB são minúsculas (ex: 'createdat', 'imageurl', 'allowcustomization')
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: isNaN(Number(dbProduct.price)) ? 0 : Number(dbProduct.price),
    category: dbProduct.category,
    imageUrl: dbProduct.imageurl, // Mapeia 'imageurl' do DB para 'imageUrl' no tipo Product (ou manter 'imageurl' no tipo Product)
    stock: isNaN(Number(dbProduct.stock)) ? 0 : Number(dbProduct.stock),
    featured: dbProduct.featured || false,
    discount: isNaN(Number(dbProduct.discount)) ? 0 : Number(dbProduct.discount || 0),
    createdat: parseDate(dbProduct.createdat), // Lê 'createdat' do DB
    descriptionImages: dbProduct.descriptionimages || [], // Mapeia 'descriptionimages'
    specificationImages: dbProduct.specificationimages || [], // Mapeia 'specificationimages'
    deliveryImages: dbProduct.deliveryimages || [], // Mapeia 'deliveryimages'
    allowCustomization: dbProduct.allowcustomization || false, // Mapeia 'allowcustomization'
    colors: dbProduct.colors || [],
    // selectedColor não vem do DB
  };
};

const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Troféu de Ouro Mock',
        description: 'Troféu de ouro para premiações esportivas (mock)',
        price: 129.99,
        category: 'trofeus',
        imageurl: '/placeholder.svg', // Usando minúsculo conforme tipo Product
        stock: 15,
        featured: true,
        discount: 10,
        createdat: new Date(),
        descriptionimages: [], // Usando minúsculo
        specificationimages: [], // Usando minúsculo
        deliveryimages: [], // Usando minúsculo
        allowcustomization: true, // Usando minúsculo
        colors: ['gold', 'silver']
      },
      {
        id: '2',
        name: 'Porta Medalhas Mock',
        description: 'Porta medalhas personalizável (mock)',
        price: 89.99,
        category: 'porta-medalhas',
        imageurl: '/placeholder.svg', // Usando minúsculo
        stock: 8,
        featured: false,
        discount: 0,
        createdat: new Date(),
        descriptionimages: [], // Usando minúsculo
        specificationimages: [], // Usando minúsculo
        deliveryimages: [], // Usando minúsculo
        allowcustomization: true, // Usando minúsculo
        colors: ['black', 'white']
      }
];

export const getAllProducts = async (): Promise<Product[]> => {
  console.log("productsService: getAllProducts iniciado");
  if (!isSupabaseConfigured()) {
    console.log('productsService: Usando mock data para getAllProducts');
    return Promise.resolve([...mockProducts]); // Mock já está no formato Product
  }

  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*') // Seleciona todas as colunas, o mapeamento é feito em formatProductFromDB
      .order('createdat', { ascending: false }); // Ordena pela coluna 'createdat' do banco

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

export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
    console.log("productsService: createProduct iniciado com (recebido do form):", JSON.stringify(productFormData, null, 2));
    if (!isSupabaseConfigured()) {
        console.log("productsService: Usando mock data para criar produto");
        const newProduct: Product = { // Tipagem explícita para Product
            id: `mock-${Date.now()}`,
            name: productFormData.name,
            description: productFormData.description,
            price: Number(productFormData.price),
            category: productFormData.category,
            imageurl: productFormData.imageurl || '',
            stock: Number(productFormData.stock),
            featured: productFormData.featured || false,
            discount: Number(productFormData.discount || 0),
            createdat: productFormData.createdat || new Date(),
            descriptionimages: productFormData.descriptionimages || [],
            specificationimages: productFormData.specificationimages || [],
            deliveryimages: productFormData.deliveryimages || [],
            allowcustomization: productFormData.allowcustomization || false,
            colors: productFormData.colors || [],
        };
        return Promise.resolve(newProduct);
    }

    const finalProductDataForDB = formatProductForDB(productFormData);

    console.log("productsService: Enviando para o Supabase (createProduct - finalProductDataForDB):", JSON.stringify(finalProductDataForDB, null, 2));

    try {
        const { data, error } = await supabase
            .from(PRODUCTS_TABLE)
            .insert(finalProductDataForDB)
            .select()
            .single();

        if (error) {
            console.error('productsService: Erro ao criar produto no Supabase:', error);
            console.error('productsService: Detalhes do erro Supabase:', JSON.stringify(error, null, 2));
            throw error;
        }
        console.log("productsService: Produto criado no Supabase com sucesso (raw):", data);
        return formatProductFromDB(data);
    } catch (err: any) {
        console.error('productsService: Falha ao criar produto (catch global):', err);
        const message = err.message || 'Ocorreu um erro desconhecido.';
        const details = err.details || '';
        const hint = err.hint || '';
        console.error(`Supabase error details (create): Message: ${message}, Details: ${details}, Hint: ${hint}, Code: ${err.code}`);
        throw new Error(`Falha ao criar produto: ${message} ${details} ${hint}`.trim());
    }
};

export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
  console.log(`productsService: updateProduct (ID: ${id}) iniciado com:`, productFormData);
  if (!isSupabaseConfigured()) {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index >= 0) {
        const updatedMockProduct: Product = {
            ...mockProducts[index], // Pega o estado atual do mock
            ...productFormData,     // Sobrescreve com os dados do formulário
            createdat: productFormData.createdat || mockProducts[index].createdat, // Mantém ou atualiza createdat
        };
        mockProducts[index] = updatedMockProduct; // Atualiza o array de mocks
        console.log(`productsService: Mock data atualizado para produto (ID: ${id}):`, updatedMockProduct);
        return Promise.resolve(updatedMockProduct);
    }
    throw new Error('Produto mock não encontrado para atualização');
  }

  const finalProductDataForDB = formatProductForDB(productFormData);
  console.log(`productsService: formattedProduct para Supabase (Update ID: ${id}):`, JSON.stringify(finalProductDataForDB, null, 2));

  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .update(finalProductDataForDB)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`productsService: Erro ao atualizar produto (ID: ${id}) no Supabase:`, error);
      console.error('productsService: Detalhes do erro Supabase (update):', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log(`productsService: Produto (ID: ${id}) atualizado no Supabase com sucesso (raw):`, data);
    return formatProductFromDB(data);
  } catch (err: any) {
    console.error(`productsService: Falha ao atualizar produto (ID: ${id}) (catch global):`, err);
    const message = err.message || 'Ocorreu um erro desconhecido.';
    throw new Error(`Falha ao atualizar produto: ${message}`.trim());
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  console.log(`productsService: deleteProduct (ID: ${id}) iniciado`);
  if (!isSupabaseConfigured()) {
    const initialLength = mockProducts.length;
    // mockProducts = mockProducts.filter(p => p.id !== id); // Recriar array se mockProducts for const
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