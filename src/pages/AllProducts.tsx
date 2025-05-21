
import { useState } from "react";
import { Product } from "@/types/Product";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Search } from "lucide-react";

// Mock data - in a real app, this would come from an API
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
  },
  {
    id: "5",
    name: "Porta Medalhas Personalizado",
    description: "Porta medalhas com gravação personalizada do nome do atleta.",
    price: 199.99,
    category: "porta-medalhas",
    imageUrl: "https://images.unsplash.com/photo-1587723958656-ee042cc565a1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG1lZGFsc3xlbnwwfHwwfHx8MA%3D%3D",
    stock: 7,
    discount: 5,
    featured: true,
    createdAt: new Date()
  },
  {
    id: "6",
    name: "Troféu Personalizado",
    description: "Troféu metálico premium com gravação personalizada.",
    price: 349.99,
    category: "trofeus",
    imageUrl: "https://images.unsplash.com/photo-1601340494744-8ce9b3b342e5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8dHJvcGh5fGVufDB8fDB8fHww",
    stock: 3,
    discount: 0,
    featured: true,
    createdAt: new Date()
  }
];

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

export default function AllProductsPage() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  
  // Filter products by search term
  const filteredProducts = products.filter(
    product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-asc":
        const priceA = a.discount ? a.price - (a.price * a.discount / 100) : a.price;
        const priceB = b.discount ? b.price - (b.price * b.discount / 100) : b.price;
        return priceA - priceB;
      case "price-desc":
        const priceADesc = a.discount ? a.price - (a.price * a.discount / 100) : a.price;
        const priceBDesc = b.discount ? b.price - (b.price * b.discount / 100) : b.price;
        return priceBDesc - priceADesc;
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "featured":
      default:
        if (a.featured === b.featured) return 0;
        return a.featured ? -1 : 1;
    }
  });
  
  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold mb-2">Todos os Produtos</h1>
          <p className="text-muted-foreground mb-8">
            Confira nossa coleção completa de troféus e porta medalhas
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Em destaque</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-xl font-medium">Nenhum produto encontrado</h2>
              <p className="text-muted-foreground mt-2">
                Tente buscar por outro termo ou limpar os filtros.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    addToCart={handleAddToCart} 
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                        </PaginationItem>
                      )}
                      
                      {pageNumbers.map(number => (
                        <PaginationItem key={number}>
                          <PaginationLink 
                            isActive={currentPage === number} 
                            onClick={() => handlePageChange(number)}
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-sport-dark text-white py-8">
        <div className="container px-4 md:px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Oficina do Corte. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
