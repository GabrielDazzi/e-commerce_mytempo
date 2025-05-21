
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/types/Product";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";

// Mock products data (should be replaced with API call in production)
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Porta Medalhas Premium",
    description: "Porta medalhas de metal com espaço para 20 medalhas. Ideal para atletas dedicados.",
    price: 149.99,
    category: "porta-medalhas",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzJTIwbWVkYWx8ZW58MHx8MHx8fDA%3D",
    stock: 15,
    featured: true,
    createdAt: new Date(),
    allowCustomization: true
  },
  {
    id: "2",
    name: "Troféu Campeão Nacional",
    description: "Troféu banhado a ouro para premiação de campeonatos nacionais.",
    price: 299.99,
    category: "trofeus",
    imageUrl: "https://images.unsplash.com/photo-1569513586164-80529357ad6f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyb3BoeXxlbnwwfHwwfHx8MA%3D%3D",
    stock: 5,
    discount: 10,
    featured: true,
    createdAt: new Date(),
    allowCustomization: true
  },
  {
    id: "3",
    name: "Porta Medalhas Triplo",
    description: "Suporte para medalhas com 3 níveis, comportando até 30 medalhas.",
    price: 179.99,
    category: "porta-medalhas",
    imageUrl: "https://images.unsplash.com/photo-1567427013953-33abb88c8390?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWVkYWxzfGVufDB8fDB8fHww",
    stock: 8,
    featured: false,
    createdAt: new Date(),
    allowCustomization: true
  },
  {
    id: "4",
    name: "Troféu Regional",
    description: "Troféu de acrílico para premiações regionais e municipais.",
    price: 129.99,
    category: "trofeus",
    imageUrl: "https://images.unsplash.com/photo-1591189824397-cf6550262b4c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHRyb3BoeXxlbnwwfHwwfHx8MA%3D%3D",
    stock: 12,
    featured: false,
    createdAt: new Date(),
    allowCustomization: false
  }
];

// Function to get category label
const getCategoryLabel = (category: string): string => {
  switch (category) {
    case "porta-medalhas":
      return "Porta Medalhas";
    case "trofeus":
      return "Troféus";
    case "medalhas":
      return "Medalhas";
    default:
      return category;
  }
};

// Cart storage in localStorage
const addToCart = (product: Product) => {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  
  const existingItemIndex = cartItems.findIndex(
    (item: { productId: string }) => item.productId === product.id
  );
  
  if (existingItemIndex !== -1) {
    cartItems[existingItemIndex].quantity += 1;
  } else {
    cartItems.push({
      productId: product.id,
      quantity: 1,
      product
    });
  }
  
  localStorage.setItem("cart", JSON.stringify(cartItems));
};

export default function CategoryPage() {
  const { categoryId = "" } = useParams<{ categoryId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const categoryLabel = getCategoryLabel(categoryId);
  
  useEffect(() => {
    // Simulate API call with delay
    setLoading(true);
    setTimeout(() => {
      const filtered = MOCK_PRODUCTS.filter(
        product => product.category === categoryId
      );
      setProducts(filtered);
      setLoading(false);
    }, 300);
  }, [categoryId]);
  
  // Filter products by search query
  const filteredProducts = products.filter(
    product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "featured":
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold mb-2">{categoryLabel}</h1>
          <p className="text-muted-foreground mb-6">
            Encontre os melhores {categoryLabel.toLowerCase()} para sua coleção de conquistas
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${categoryLabel.toLowerCase()}...`}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select defaultValue={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Em destaque</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator className="my-6" />
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-md p-4 h-[300px] animate-pulse">
                  <div className="h-40 bg-muted rounded-md mb-4"></div>
                  <div className="h-4 bg-muted rounded-md mb-2 w-3/4"></div>
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="product-grid">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mt-1">
                Tente alterar os filtros ou busque por outro termo
              </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-sport-dark text-white py-8">
        <div className="container px-4 md:px-6 text-center">
          <p>&copy; {new Date().getFullYear()} TrophySports. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
