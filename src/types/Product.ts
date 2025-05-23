// src/types/Product.ts

export interface SpecificationItem { // Novo tipo para cada item de especificação
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  featured?: boolean;
  discount?: number;
  createdAt: Date;
  descriptionImages?: string[];
  specificationImages?: string[];
  deliveryImages?: string[];
  allowCustomization?: boolean; // Pode ser mantido ou removido
  allowCustomName?: boolean; // NOVA FLAG
  allowCustomModality?: boolean; // NOVA FLAG
  allowCustomColorSelection?: boolean; // NOVA FLAG
  colors?: string[];
  selectedColor?: string;
  specifications?: SpecificationItem[];
}

export type ProductFormData = Omit<Product, 'id'> & {
  createdAt?: Date;
  // descriptionImages, specificationImages, deliveryImages já estão incluídos por Omit<Product, 'id'>
  // As novas flags allowCustomName, allowCustomModality, allowCustomColorSelection
  // também serão incluídas pelo Omit se adicionadas à interface Product.
};

export type CartItem = {
  productId: string;
  quantity: number;
  product: Product;
  customName?: string;
  customModality?: string;
  selectedColor?: string;
};

export const DEFAULT_PRODUCT_COLORS = [
  '#3F2D21', // Amadeirado-Escuro
  '#D4C7B7', // Amadeirado-Claro
  '#008000', // Green
  '#FFFF00', // Yellow
  '#800080', // Purple
  '#FFA500', // Orange
];