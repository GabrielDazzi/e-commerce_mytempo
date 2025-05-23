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
  specificationImages?: string[]; // Pode ser mantido se forem imagens SEPARADAS das especificações de texto
  deliveryImages?: string[];
  allowCustomization?: boolean;
  colors?: string[];
  selectedColor?: string;
  specifications?: SpecificationItem[]; // NOVO CAMPO
}

export type ProductFormData = Omit<Product, 'id'> & {
  createdAt?: Date;
  // specifications já está incluído por Omit<Product, 'id'> se não for opcional em Product
  // Se specifications for opcional em Product, e você quer que seja sempre um array no form (mesmo que vazio):
  // specifications?: SpecificationItem[];
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