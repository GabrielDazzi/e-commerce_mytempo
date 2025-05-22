// src/pages/CategoryPage.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/types/Product";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { getProductsByCategory } from "@/services/productsService"; // Import getProductsByCategory

// Remove MOCK_PRODUCTS as it will now come from Supabase
// const MOCK_PRODUCTS: Product[] = [...]

// Function to get category label - Keep as is
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

// Cart storage in localStorage - Keep as is
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
  const [products, setProducts] = useState<Product[]>([]); // Initialize with empty array
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const categoryLabel = getCategoryLabel(categoryId);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const fetchedProducts = await getProductsByCategory(categoryId); // Fetch products by category from Supabase
        setProducts(fetchedProducts);
      } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        // Optionally show a toast error
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) { // Ensure categoryId is available before fetching
      fetchCategoryProducts();
    }
  }, [categoryId]); // Depend on categoryId to refetch when it changes


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