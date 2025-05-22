
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  featured?: boolean;
  discount?: number;
  createdAt: Date;
  descriptionImages?: string[];
  specificationImages?: string[];
  deliveryImages?: string[];
  allowCustomization?: boolean;
  colors?: string[];
  selectedColor?: string;
}

// Updated to include createdAt but make it optional
export type ProductFormData = Omit<Product, 'id'> & {
  createdAt?: Date;
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
