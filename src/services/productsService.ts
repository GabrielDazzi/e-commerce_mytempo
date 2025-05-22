
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types/Product';

// Table name in Supabase
const PRODUCTS_TABLE = 'products';

// Helper function to convert Supabase date string to Date object
const parseDate = (dateString: string | null): Date => {
  return dateString ? new Date(dateString) : new Date();
};

// Format product data for Supabase (convert Date to ISO string)
const formatProductForDB = (product: ProductFormData | Product) => {
  return {
    ...product,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : new Date().toISOString(),
    descriptionImages: product.descriptionImages || [],
    specificationImages: product.specificationImages || [],
    deliveryImages: product.deliveryImages || [],
    colors: product.colors || [],
  };
};

// Format product from DB to our application model
const formatProductFromDB = (product: any): Product => {
  return {
    ...product,
    createdAt: parseDate(product.createdAt),
    price: Number(product.price),
    stock: Number(product.stock),
    discount: product.discount ? Number(product.discount) : 0,
  };
};

// Mock data for development when Supabase is not configured
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Troféu de Ouro',
    description: 'Troféu de ouro para premiações esportivas',
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
    colors: ['gold', 'silver']
  },
  {
    id: '2',
    name: 'Porta Medalhas',
    description: 'Porta medalhas personalizável',
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
    colors: ['black', 'white']
  }
];

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Using mock data for products');
    return mockProducts;
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return (data || []).map(formatProductFromDB);
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) {
    const product = mockProducts.find(p => p.id === id);
    return product || null;
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  
  return formatProductFromDB(data);
};

// Create a new product
export const createProduct = async (product: ProductFormData): Promise<Product> => {
  if (!isSupabaseConfigured()) {
    const newProduct = {
      id: `mock-${Date.now()}`,
      ...product,
      createdAt: new Date()
    };
    mockProducts.push(newProduct);
    return newProduct;
  }

  const formattedProduct = formatProductForDB({
    ...product,
    createdAt: new Date()
  });
  
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .insert(formattedProduct)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }
  
  return formatProductFromDB(data);
};

// Update an existing product
export const updateProduct = async (id: string, product: ProductFormData): Promise<Product> => {
  if (!isSupabaseConfigured()) {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index >= 0) {
      const updatedProduct = {
        ...mockProducts[index],
        ...product,
      };
      mockProducts[index] = updatedProduct;
      return updatedProduct;
    }
    throw new Error('Product not found');
  }

  const formattedProduct = formatProductForDB(product);
  
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .update(formattedProduct)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }
  
  return formatProductFromDB(data);
};

// Delete a product
export const deleteProduct = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index >= 0) {
      mockProducts.splice(index, 1);
      return;
    }
    return;
  }

  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Search products
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }
  
  return (data || []).map(formatProductFromDB);
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter(product => product.category === category);
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('category', category)
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
  
  return (data || []).map(formatProductFromDB);
};

// Get featured products
export const getFeaturedProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter(product => product.featured);
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('featured', true)
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
  
  return (data || []).map(formatProductFromDB);
};
