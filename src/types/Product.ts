export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageurl?: string; // minúsculo
  stock: number;
  featured?: boolean;
  discount?: number;
  createdat: Date; // minúsculo
  descriptionimages?: string[]; // minúsculo
  specificationimages?: string[]; // minúsculo
  deliveryimages?: string[]; // minúsculo
  allowcustomization?: boolean; // minúsculo
  colors?: string[]; // minúsculo
  selectedColor?: string;
}

export type ProductFormData = Omit<Product, 'id'> & {
  createdat?: Date;
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