// src/services/productsService.ts
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductFormData, SpecificationItem } from '@/types/Product';

const PRODUCTS_TABLE = 'products';

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
      createdAtISO = new Date().toISOString();
    }

    const dataForSupabase: any = {
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category,
      stock: Number(product.stock),
      imageurl: product.imageUrl,
      featured: product.featured,
      discount: Number(product.discount || 0),
      descriptionimages: product.descriptionImages || [],
      specificationimages: product.specificationImages || [],
      deliveryimages: product.deliveryImages || [],
      allowcustomization: product.allowCustomization,
      allowcustomname: product.allowCustomName, // NOVO
      allowcustommodality: product.allowCustomModality, // NOVO
      allowcustomcolorselection: product.allowCustomColorSelection, // NOVO
      colors: product.colors,
      specifications: product.specifications || [],
    };

    if (!('id'in product) || !product.id) {
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
    const formattedProduct = {
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
      allowCustomName: dbProduct.allowcustomname || false, // NOVO
      allowCustomModality: dbProduct.allowcustommodality || false, // NOVO
      allowCustomColorSelection: dbProduct.allowcustomcolorselection || false, // NOVO
      colors: dbProduct.colors || [],
      specifications: dbProduct.specifications || [],
    };
    return formattedProduct;
  };

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
          descriptionImages: ['/placeholder.svg', '/placeholder.svg'],
          specificationImages: ['/placeholder.svg'],
          deliveryImages: [],
          allowCustomization: true,
          allowCustomName: true, // NOVO
          allowCustomModality: true, // NOVO
          allowCustomColorSelection: true, // NOVO
          colors: ['gold', 'silver'],
          specifications: [{name: "Material Mock", value: "Plástico ABS"}, {name: "Altura Mock", value: "30cm"}],
        },
  ];

  export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
      console.log("productsService: createProduct com (form data):", productFormData);
      if (!isSupabaseConfigured()) {
        const newProduct: Product = {
              id: `mock-${Date.now()}`,
              ...productFormData,
              price: Number(productFormData.price),
              stock: Number(productFormData.stock),
              discount: Number(productFormData.discount || 0),
              createdAt: productFormData.createdAt || new Date(),
              specifications: productFormData.specifications || [],
              descriptionImages: productFormData.descriptionImages || [],
              specificationImages: productFormData.specificationImages || [],
              deliveryImages: productFormData.deliveryImages || [],
              allowCustomName: productFormData.allowCustomName || false, // NOVO
              allowCustomModality: productFormData.allowCustomModality || false, // NOVO
              allowCustomColorSelection: productFormData.allowCustomColorSelection || false, // NOVO
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
          if (error) { throw error; }
          return formatProductFromDB(data);
      } catch (err: any) { throw err; }
  };

  export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
      console.log(`productsService: updateProduct (ID: ${id}) com (form data):`, productFormData);
       if (!isSupabaseConfigured()) {
          const index = mockProducts.findIndex(p => p.id === id);
          if (index >= 0) {
              const updatedMockProduct: Product = {
                  ...mockProducts[index],
                  ...productFormData,
                  price: Number(productFormData.price),
                  stock: Number(productFormData.stock),
                  discount: Number(productFormData.discount || 0),
                  createdAt: productFormData.createdAt || mockProducts[index].createdAt,
                  specifications: productFormData.specifications || mockProducts[index].specifications,
                  descriptionImages: productFormData.descriptionImages || mockProducts[index].descriptionImages,
                  specificationImages: productFormData.specificationImages || mockProducts[index].specificationImages,
                  deliveryImages: productFormData.deliveryImages || mockProducts[index].deliveryImages,
                  allowCustomName: productFormData.allowCustomName || mockProducts[index].allowCustomName, // NOVO
                  allowCustomModality: productFormData.allowCustomModality || mockProducts[index].allowCustomModality, // NOVO
                  allowCustomColorSelection: productFormData.allowCustomColorSelection || mockProducts[index].allowCustomColorSelection, // NOVO
              };
              mockProducts[index] = updatedMockProduct;
              return Promise.resolve(updatedMockProduct);
          }
          throw new Error('Produto mock não encontrado para atualização');
      }

      const finalProductDataForDB = formatProductForDB(productFormData);
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
           if (error) { throw error; }
          return formatProductFromDB(data);
      } catch (err: any) { throw err; }
  };

  export const getAllProducts = async (): Promise<Product[]> => {
    if (!isSupabaseConfigured()) {
      return Promise.resolve([...mockProducts].map(p => formatProductFromDB(formatProductForDB(p)))); // Garante formatação consistente
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
    if (!isSupabaseConfigured()) {
      const product = mockProducts.find(p => p.id === id);
      return product ? Promise.resolve(formatProductFromDB(formatProductForDB(product))) : Promise.resolve(null); // Garante formatação
    }

    try {
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data ? formatProductFromDB(data) : null;
    } catch (err) {
       if (err instanceof Error) {
          throw err;
      }
      throw new Error(`Falha desconhecida ao buscar produto por ID ${id}`);
    }
  };

  export const deleteProduct = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
          mockProducts.splice(index, 1);
      }
      return Promise.resolve();
    }

    try {
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      const message = err.message || 'Ocorreu um erro desconhecido.';
      throw new Error(`Falha ao deletar produto: ${message}`.trim());
    }
  };

  export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    if (!isSupabaseConfigured()) {
      return mockProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ).map(p => formatProductFromDB(formatProductForDB(p))); // Garante formatação
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
      if (!isSupabaseConfigured()) return mockProducts.filter(product => product.category === category).map(p => formatProductFromDB(formatProductForDB(p))); // Garante formatação
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
      if (!isSupabaseConfigured()) return mockProducts.filter(product => product.featured).map(p => formatProductFromDB(formatProductForDB(p))); // Garante formatação
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