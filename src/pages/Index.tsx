import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Product } from "@/types/Product";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Scissors } from "lucide-react";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from "@/components/ui/carousel";

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

export default function IndexPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("featured");

  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter(product => product.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
      );
    }

    // Sort products
    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => {
          const priceA = a.discount ? a.price - (a.price * a.discount / 100) : a.price;
          const priceB = b.discount ? b.price - (b.price * b.discount / 100) : b.price;
          return priceA - priceB;
        });
        break;
      case "price-desc":
        result.sort((a, b) => {
          const priceA = a.discount ? a.price - (a.price * a.discount / 100) : a.price;
          const priceB = b.discount ? b.price - (b.price * b.discount / 100) : b.price;
          return priceB - priceA;
        });
        break;
      case "newest":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "featured":
      default:
        result.sort((a, b) => {
          if (a.featured === b.featured) return 0;
          return a.featured ? -1 : 1;
        });
        break;
    }

    setFilteredProducts(result);
  }, [products, activeCategory, searchTerm, sortOption]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };

  const featuredProducts = products.filter(product => product.featured);

  // Carousel images for the hero background
  const heroImages = [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzJTIwbWVkYWx8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzJTIwbWVkYWx8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzJTIwbWVkYWx8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzJTIwbWVkYWx8ZW58MHx8MHx8fDA%3D"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Carousel Background */}
        <section className="relative overflow-hidden">
          {/* Carousel Background */}
          <div className="absolute inset-0 w-full h-full">
            <Carousel className="w-full h-full" autoPlay loop interval={5000}>
              <CarouselContent className="h-full">
                {heroImages.map((image, index) => (
                  <CarouselItem key={index} className="h-full">
                    <div
                      className="w-full h-[500px] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${image})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 py-20 px-4">
            <div className="container mx-auto text-center">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="inline-block bg-sport-gold px-3 py-1 rounded-full text-sport-dark font-medium text-sm mb-2">
                  Produtos de alta qualidade
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Os melhores porta medalhas e troféus para seus momentos especiais
                </h1>
                <p className="text-lg text-white/90 max-w-md mx-auto">
                  Eternize suas conquistas com nossos produtos exclusivos, feitos para celebrar cada vitória.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button size="lg" className="bg-sport-red text-white hover:bg-sport-red/90">
                    Ver Produtos
                  </Button>
                  <Button size="lg" className="bg-sport-red text-white hover:bg-sport-red/90">
                    Saiba Mais
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Produtos em Destaque</h2>
                <p className="text-muted-foreground">Descubra nossos melhores produtos</p>
              </div>
              <Button variant="link" className="md:mt-0 mt-2">
                Ver todos os produtos
              </Button>
            </div>

            <div className="product-grid">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 bg-muted/50">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">
              Nossas Categorias
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className="bg-sport-gold/20 p-4 rounded-full">
                  <Medal className="h-8 w-8 text-sport-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Porta Medalhas</h3>
                  <p className="text-muted-foreground">Organize e exiba suas conquistas</p>
                  <Button variant="link" className="p-0 h-auto mt-1">
                    Ver produtos
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className="bg-sport-blue/20 p-4 rounded-full">
                  <Trophy className="h-8 w-8 text-sport-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Troféus</h3>
                  <p className="text-muted-foreground">Símbolos duradouros de suas vitórias</p>
                  <Button variant="link" className="p-0 h-auto mt-1">
                    Ver produtos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
              Catálogo de Produtos
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Filters Sidebar */}
              <div className="md:w-1/4 space-y-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-medium mb-3">Categorias</h3>
                  <Tabs
                    defaultValue="all"
                    className="w-full"
                    value={activeCategory}
                    onValueChange={handleCategoryChange}
                  >
                    <TabsList className="grid w-full grid-cols-2 h-auto mb-2">
                      <TabsTrigger value="all" className="text-sm">Todos</TabsTrigger>
                      <TabsTrigger value="porta-medalhas" className="text-sm">Porta Medalhas</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-2 h-auto">
                      <TabsTrigger value="trofeus" className="text-sm">Troféus</TabsTrigger>
                      <TabsTrigger value="medalhas" className="text-sm">Medalhas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-medium mb-3">Ordenar por</h3>
                  <Select
                    value={sortOption}
                    onValueChange={setSortOption}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Em destaque</SelectItem>
                      <SelectItem value="price-asc">Menor preço</SelectItem>
                      <SelectItem value="price-desc">Maior preço</SelectItem>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-medium mb-3">Buscar</h3>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      type="search"
                      placeholder="Nome do produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" size="sm">
                      Buscar
                    </Button>
                  </form>
                </div>
              </div>

              {/* Products Grid */}
              <div className="md:w-3/4">
                {filteredProducts.length > 0 ? (
                  <div className="product-grid">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      Nenhum produto encontrado com os filtros atuais.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setActiveCategory("all");
                        setSearchTerm("");
                        setSortOption("featured");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sport-dark text-white py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sport-gold font-bold text-lg mb-3">Oficina do Corte</h3>
              <p className="text-white/80">
                Especializados em porta medalhas, troféus e artigos para celebrar suas conquistas esportivas.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Links Rápidos</h4>
              <ul className="space-y-2 text-white/80">
                <li><a href="#" className="hover:text-sport-gold transition">Início</a></li>
                <li><a href="/categorias/porta-medalhas" className="hover:text-sport-gold transition">Porta Medalhas</a></li>
                <li><a href="/categorias/trofeus" className="hover:text-sport-gold transition">Troféus</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Contato</h4>
              <ul className="space-y-2 text-white/80">
                <li>gruporochaes@gmail.com</li>
                <li>+55 27 92000-8182</li>
                <li>Av. Mateus Cunha Fundão, 337
                  Sernamby, São Mateus
                  ES, 29931-360</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60">
            <p>&copy; {new Date().getFullYear()} Oficina do Corte. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
