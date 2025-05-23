// src/types/Product.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string; // Alterado de imageurl
  stock: number;
  featured?: boolean;
  discount?: number;
  createdAt: Date; // Alterado de createdat
  descriptionImages?: string[]; // Alterado de descriptionimages
  specificationImages?: string[]; // Alterado de specificationimages
  deliveryImages?: string[]; // Alterado de deliveryimages
  allowCustomization?: boolean; // Alterado de allowcustomization
  colors?: string[];
  selectedColor?: string;
}

// ProductFormData pode permanecer como está ou ser ajustado se necessário,
// mas Omit<Product, 'id'> já refletirá as mudanças acima.
export type ProductFormData = Omit<Product, 'id'> & {
  // createdAt pode ser opcional aqui e no formulário,
  // se for gerado no backend ou no momento da criação.
  // Se ele é obrigatório no formulário, remova a opcionalidade.
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