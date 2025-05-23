import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types/Product'; // Usa seu Product.ts com camelCase

const PRODUCTS_TABLE = 'products';

const parseDate = (dateString: string | null): Date => {
  return dateString ? new Date(dateString) : new Date();
};

// Formata ANTES de enviar para o DB.
// O objeto enviado terá chaves camelCase. O Supabase client mapeará para colunas minúsculas/snake_case.
const formatProductForDB = (product: Partial<ProductFormData | Product>): any => {
  const dataForSupabase: any = {};

  // Copia todas as propriedades do produto (que estão em camelCase)
  // A biblioteca cliente do Supabase deve lidar com o mapeamento para colunas minúsculas/snake_case
  (Object.keys(product) as Array<keyof Partial<ProductFormData | Product>>).forEach(key => {
    if (product[key] !== undefined) {
        // Tratamento especial para data
        if (key === 'createdAt' && product.createdAt) {
            if (product.createdAt instanceof Date) {
                dataForSupabase.createdAt = product.createdAt.toISOString();
            } else if (typeof product.createdAt === 'string') {
                try { dataForSupabase.createdAt = new Date(product.createdAt).toISOString(); }
                catch { dataForSupabase.createdAt = new Date().toISOString(); }
            }
        } else if (['price', 'stock', 'discount'].includes(key)) {
            dataForSupabase[key] = Number(product[key as 'price' | 'stock' | 'discount'] || 0);
        }
         else {
            dataForSupabase[key] = product[key];
        }
    }
  });

  // Se for uma criação e createdAt não foi fornecido, define agora
  if (!('id' in product) && !dataForSupabase.createdAt && product.createdAt === undefined) {
    dataForSupabase.createdAt = new Date().toISOString();
  }

  // Garante defaults para campos booleanos e arrays se não estiverem presentes
  dataForSupabase.featured = product.featured === undefined ? false : product.featured;
  dataForSupabase.allowCustomization = product.allowCustomization === undefined ? false : product.allowCustomization;
  dataForSupabase.descriptionImages = product.descriptionImages || [];
  dataForSupabase.specificationImages = product.specificationImages || [];
  dataForSupabase.deliveryImages = product.deliveryImages || [];
  dataForSupabase.colors = product.colors || [];
  dataForSupabase.discount = product.discount === undefined ? 0 : Number(product.discount);
  dataForSupabase.stock = product.stock === undefined ? 0 : Number(product.stock);


  delete dataForSupabase.selectedColor; // Não pertence ao DB
  if ('id' in product) { // Se for um update, não envie 'id' no corpo
    delete dataForSupabase.id;
  }


  console.log("formatProductForDB - Enviando para Supabase (chaves camelCase):", JSON.stringify(dataForSupabase, null, 2));
  return dataForSupabase;
};

// Formata APÓS receber do DB (colunas do DB são minúsculas, ex: 'createdat', 'allowcustomization')
const formatProductFromDB = (dbProduct: any): Product => {
  console.log("formatProductFromDB - Recebido do DB (chaves minúsculas):", dbProduct);
  const productOutput: Product = {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: isNaN(Number(dbProduct.price)) ? 0 : Number(dbProduct.price),
    category: dbProduct.category,
    imageUrl: dbProduct.imageurl || '', // DB: imageurl -> TS: imageUrl
    stock: isNaN(Number(dbProduct.stock)) ? 0 : Number(dbProduct.stock),
    featured: dbProduct.featured || false,
    discount: isNaN(Number(dbProduct.discount)) ? 0 : Number(dbProduct.discount || 0),
    createdAt: parseDate(dbProduct.createdat), // DB: createdat -> TS: createdAt
    descriptionImages: dbProduct.descriptionimages || [], // DB: descriptionimages -> TS: descriptionImages
    specificationImages: dbProduct.specificationimages || [], // DB: specificationimages -> TS: specificationImages
    deliveryImages: dbProduct.deliveryimages || [],   // DB: deliveryimages -> TS: deliveryImages
    allowCustomization: dbProduct.allowcustomization || false, // DB: allowcustomization -> TS: allowCustomization
    colors: dbProduct.colors || [], // DB: colors -> TS: colors
  };
  console.log("formatProductFromDB - Formatado para App (chaves camelCase):", productOutput);
  return productOutput;
};

const mockProducts: Product[] = [/* Seus mocks devem usar camelCase conforme Product.ts */];

export const getAllProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  try {
    // Supabase client espera nome da coluna do DB para order
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').order('createdat', { ascending: false });
    if (error) { console.error('getAllProducts Supabase error:', error); throw error; }
    return (data || []).map(formatProductFromDB);
  } catch (err) { console.error('getAllProducts catch error:', err); throw err as Error; }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  try {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('getProductById Supabase error:', error); throw error;
    }
    return data ? formatProductFromDB(data) : null;
  } catch (err) { console.error('getProductById catch error:', err); throw err as Error; }
};

export const createProduct = async (productFormData: ProductFormData): Promise<Product> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  const finalProductDataForDB = formatProductForDB(productFormData); // Objeto com chaves camelCase
  try {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).insert(finalProductDataForDB).select().single();
    if (error) { console.error('createProduct Supabase error:', error, 'Data sent:', finalProductDataForDB); throw error; }
    return formatProductFromDB(data);
  } catch (err: any) { console.error('createProduct catch error:', err, 'Data sent:', finalProductDataForDB); throw new Error(err.message || "Erro desconhecido ao criar produto"); }
};

export const updateProduct = async (id: string, productFormData: ProductFormData): Promise<Product> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  const finalProductDataForDB = formatProductForDB(productFormData);
  try {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).update(finalProductDataForDB).eq('id', id).select().single();
    if (error) { console.error('updateProduct Supabase error:', error, 'Data sent:', finalProductDataForDB); throw error; }
    return formatProductFromDB(data);
  } catch (err: any) { console.error('updateProduct catch error:', err, 'Data sent:', finalProductDataForDB); throw new Error(err.message || "Erro desconhecido ao atualizar produto");}
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return Promise.resolve();
  const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq('id', id);
  if (error) { console.error('deleteProduct Supabase error:', error); throw error; }
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`).order('createdat', { ascending: false });
  if (error) { console.error('searchProducts Supabase error:', error); throw error; }
  return (data || []).map(formatProductFromDB);
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('category', category).order('createdat', { ascending: false });
  if (error) { console.error('getProductsByCategory Supabase error:', error); throw error; }
  return (data || []).map(formatProductFromDB);
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) { /* ... mock ... */ }
  const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('featured', true).order('createdat', { ascending: false });
  if (error) { console.error('getFeaturedProducts Supabase error:', error); throw error; }
  return (data || []).map(formatProductFromDB);
};