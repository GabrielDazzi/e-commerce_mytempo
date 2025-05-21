
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
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt'>;

export type CartItem = {
  productId: string;
  quantity: number;
  product: Product;
  customName?: string;
  customModality?: string;
};
