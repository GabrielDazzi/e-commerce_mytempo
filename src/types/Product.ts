export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string; // camelCase
  stock: number;
  featured?: boolean;
  discount?: number;
  createdAt: Date; // camelCase
  descriptionImages?: string[]; // camelCase
  specificationImages?: string[]; // camelCase
  deliveryImages?: string[]; // camelCase
  allowCustomization?: boolean; // camelCase
  colors?: string[]; // camelCase
  selectedColor?: string; // UI only
}

export type ProductFormData = Omit<Product, 'id'> & {
  createdAt?: Date; // camelCase
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
  '#3F2D21', // Amadeirado-Escuro
  '#D4C7B7', // Amadeirado-Claro
  '#008000', // Green
  '#FFFF00', // Yellow
  '#800080', // Purple
  '#FFA500', // Orange
];