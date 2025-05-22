export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageurl?: string; // Minúsculo para corresponder ao DB (Supabase client mapeia JS imageUrl para imageurl)
  stock: number;
  featured?: boolean;
  discount?: number;
  createdat: Date; // Minúsculo para corresponder ao DB
  descriptionimages?: string[]; // Minúsculo
  specificationimages?: string[]; // Minúsculo
  deliveryimages?: string[]; // Minúsculo
  allowcustomization?: boolean; // Minúsculo
  colors?: string[];
  selectedColor?: string; // Este campo não existe no DB, apenas no frontend
}

export type ProductFormData = Omit<Product, 'id'> & {
  createdat?: Date; // Minúsculo
};

export type CartItem = {
  productId: string;
  quantity: number;
  product: Product;
  customName?: string;
  customModality?: string;
  selectedColor?: string;
};

// Default product colors
export const DEFAULT_PRODUCT_COLORS = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#008000', // Green
  '#FFFF00', // Yellow
  '#800080', // Purple
  '#FFA500', // Orange
];