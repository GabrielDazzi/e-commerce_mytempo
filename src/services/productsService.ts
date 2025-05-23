import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductFormData, DEFAULT_PRODUCT_COLORS } from '@/types/Product'; // DEFAULT_PRODUCT_COLORS não é usado aqui, mas pode ser mantido se necessário em outro local.

const PRODUCTS_TABLE = 'products';

// Helper para converter string de data para objeto Date, tratando nulos.
const parseDate = (dateString: string | null | undefined): Date => {
  if (!dateString) return new Date(); // Retorna data atual se a string for nula/undefined
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date; // Retorna data atual se a string for inválida
};

// Formata o produto ANTES de enviar para o DB
const formatProductForDB = (product: ProductFormData | Product): any => {
  let createdAtISO: string;

  // Usa product.createdAt (camelCase)
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
    // Se createdAt não for fornecido ou for undefined, e for um novo produto,
    // o Supabase pode preencher com DEFAULT NOW() se a coluna estiver configurada assim.
    // Se for uma atualização e você não quer mudar, não inclua o campo.
    // Para garantir que sempre haja um valor ao criar:
    createdAtISO = new Date().toISOString();
  }

  const dataForSupabase: any = {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock),
    // Somente enviar 'createdat' se for relevante para a operação (ex: INSERT com valor específico)
    // Se a coluna tem DEFAULT NOW() e é um INSERT, pode-se omitir 'createdat'.
    // Para UPDATE, geralmente não se atualiza 'createdat'.
    // Vamos assumir que para INSERT/UPDATE ele é fornecido pelo formulário ou é a data atual.
    createdat: createdAtISO, // Coluna do DB é 'createdat' (minúsculo)

    // Campos opcionais: usar nomes camelCase do tipo Product
    imageurl: product.imageUrl, // Mapeia product.imageUrl para a coluna 'imageurl'
    featured: product.featured,
    discount: Number(product.discount || 0),
    descriptionimages: product.descriptionImages, // Mapeia product.descriptionImages para 'descriptionimages'
    specificationimages: product.specificationImages, // Mapeia product.specificationImages para 'specificationimages'
    deliveryimages: product.deliveryImages, // Mapeia product.deliveryImages para 'deliveryimages'
    allowcustomization: product.allowCustomization, // Mapeia product.allowCustomization para 'allowcustomization'
    colors: product.colors,
  };

  // Remove chaves com valor undefined do objeto final para não sobrescrever com null no DB
  Object.keys(dataForSupabase).forEach(key => {
    if (dataForSupabase[key] === undefined) {
      delete dataForSupabase[key];
    }
  });
  // Se 'createdat' não deve ser atualizado em updates, remova-o de dataForSupabase se product.id existir.
  if ('id' in product && product.id) { // Se é um objeto Product (tem id), é uma atualização
     delete dataForSupabase.createdat; // Não atualiza createdat em updates
  }


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
    imageUrl: dbProduct.imageurl, // Mapeia 'imageurl' do DB para 'imageUrl' (camelCase)
    stock: isNaN(Number(dbProduct.stock)) ? 0 : Number(dbProduct.stock),
    featured: dbProduct.featured || false,
    discount: isNaN(Number(dbProduct.discount)) ? 0 : Number(dbProduct.discount || 0),
    createdAt: parseDate(dbProduct.createdat), // Mapeia 'createdat' para 'createdAt' (camelCase)
    descriptionImages: dbProduct.descriptionimages || [], // Mapeia 'descriptionimages' para 'descriptionImages'
    specificationImages: dbProduct.specificationimages || [], // Mapeia 'specificationimages' para 'specificationImages'
    deliveryImages: dbProduct.deliveryimages || [], // Mapeia 'deliveryimages' para 'deliveryImages'
    allowCustomization: dbProduct.allowcustomization || false, // Mapeia 'allowcustomization' para 'allowCustomization'
    colors: dbProduct.colors || [],
    // selectedColor não vem do DB, é gerenciado no frontend
  };
};

// Mock data para desenvolvimento sem Supabase, agora usando os nomes camelCase corretos
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Troféu de Ouro Mock',
        description: 'Troféu de ouro para premiações esportivas (mock)',
        price: 129.99,
        category: 'trofeus',
        imageUrl: '/placeholder.svg', // camelCase
        stock: 15,
        featured: true,
        discount: 10,
        createdAt: new Date(), // camelCase
        descriptionImages: [], // camelCase
        specificationImages: [], // camelCase
        deliveryImages: [], // camelCase
        allowCustomization: true, // camelCase
        colors: ['gold', 'silver']
      },
      {
        id: '2',
        name: 'Porta Medalhas Mock',
        description: 'Porta medalhas personalizável (mock)',
        price: 89.99,
        category: 'porta-medalhas',
        imageUrl: '/placeholder.svg', // camelCase
        stock: 8,
        featured: false,
        discount: 0,
        createdAt: new Date(), // camelCase
        descriptionImages: [], // camelCase
        specificationImages: [], // camelCase
        deliveryImages: [], // camelCase
        allowCustomization: true, // camelCase
        colors: ['black', 'white']
      }
];

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
      .order('createdat', { ascending: false }); // Coluna do DB é 'createdat'

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
      if (error.code === 'PGRST116') return null; // 'PGRST116' é " relazione con nome “...” non esiste " ou "0 rows"
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
        const newProduct: Product = {
            id: `mock-${Date.now()}`,
            name: productFormData.name,
            description: productFormData.description,
            price: Number(productFormData.price),
            category: productFormData.category,
            imageUrl: productFormData.imageUrl || '',
            stock: Number(productFormData.stock),
            featured: productFormData.featured || false,
            discount: Number(productFormData.discount || 0),
            createdAt: productFormData.createdAt || new Date(), // Usa o createdAt do form ou data atual
            descriptionImages: productFormData.descriptionImages || [],
            specificationImages: productFormData.specificationImages || [],
            deliveryImages: productFormData.deliveryImages || [],
            allowCustomization: productFormData.allowCustomization || false,
            colors: productFormData.colors || [],
        };
        mockProducts.push(newProduct); // Adiciona ao mock para consistência
        return Promise.resolve(newProduct);
    }

    const finalProductDataForDB = formatProductForDB(productFormData);
    // Certifique-se de que 'createdat' seja definido se não for default no DB
    if (!finalProductDataForDB.createdat) {
        finalProductDataForDB.createdat = new Date().toISOString();
    }


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
            ...mockProducts[index],
            ...productFormData,
            // Mantém o createdAt original se não for explicitamente passado no formulário de update
            createdAt: productFormData.createdAt || mockProducts[index].createdAt,
             // Garante que todos os campos opcionais do ProductFormData sejam aplicados
            imageUrl: productFormData.imageUrl !== undefined ? productFormData.imageUrl : mockProducts[index].imageUrl,
            featured: productFormData.featured !== undefined ? productFormData.featured : mockProducts[index].featured,
            discount: productFormData.discount !== undefined ? Number(productFormData.discount || 0) : mockProducts[index].discount,
            descriptionImages: productFormData.descriptionImages !== undefined ? productFormData.descriptionImages : mockProducts[index].descriptionImages,
            specificationImages: productFormData.specificationImages !== undefined ? productFormData.specificationImages : mockProducts[index].specificationImages,
            deliveryImages: productFormData.deliveryImages !== undefined ? productFormData.deliveryImages : mockProducts[index].deliveryImages,
            allowCustomization: productFormData.allowCustomization !== undefined ? productFormData.allowCustomization : mockProducts[index].allowCustomization,
            colors: productFormData.colors !== undefined ? productFormData.colors : mockProducts[index].colors,
        };
        mockProducts[index] = updatedMockProduct;
        console.log(`productsService: Mock data atualizado para produto (ID: ${id}):`, updatedMockProduct);
        return Promise.resolve(updatedMockProduct);
    }
    throw new Error('Produto mock não encontrado para atualização');
  }

  // Remove 'createdAt' para não tentar atualizá-lo no banco, a menos que seja uma intenção.
  // O Supabase geralmente não permite update em colunas com DEFAULT e ON UPDATE.
  const { createdAt, ...restOfProductFormData } = productFormData;
  const finalProductDataForDB = formatProductForDB(restOfProductFormData as ProductFormData); // Passar sem createdAt
   // Se você precisar definir explicitamente quais campos não devem ser atualizados:
  delete finalProductDataForDB.createdat; // Garante que não estamos tentando atualizar 'createdat'

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

// As funções deleteProduct, searchProducts, getProductsByCategory, getFeaturedProducts permanecem as mesmas
// pois a formatação principal ocorre em formatProductFromDB que já foi ajustada.

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