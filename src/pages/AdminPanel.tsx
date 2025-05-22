import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Search, 
  Trophy, 
  Medal,
  ShieldAlert,
  RefreshCw
} from "lucide-react";
import { Product, ProductFormData } from "@/types/Product"; // Product agora tem 'createdat'
import { toast } from "sonner";
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct
} from "@/services/productsService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminPanel() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  const queryClient = useQueryClient();
  
  const { 
    data: products = [], 
    isLoading,
    isError: isFetchError,
    error: fetchError,
    refetch 
  } = useQuery<Product[], Error>({ // Especificar o tipo do erro para fetchError
    queryKey: ['products'],
    queryFn: getAllProducts,
  });

  // Este useEffect lida com o toast de erro ao buscar produtos.
  // É importante que ele não cause re-renders excessivos.
  useEffect(() => {
    if (isFetchError && fetchError) {
      // Verifica para não mostrar o toast repetidamente se o erro persistir
      // Você pode adicionar uma lógica mais sofisticada se necessário (ex: ID do toast)
      console.error("AdminPanel: Erro ao buscar produtos (useQuery):", fetchError);
      toast.error(`Erro ao buscar produtos: ${fetchError.message}`);
    }
  }, [isFetchError, fetchError]); // Executa apenas quando isFetchError ou fetchError mudam
  
  const createProductMutation = useMutation<Product, Error, ProductFormData>({ // Tipos para useMutation
    mutationFn: createProduct,
    onSuccess: (data) => { // data é o produto retornado
      console.log("AdminPanel: createProductMutation onSuccess, Data:", data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto adicionado com sucesso!");
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("AdminPanel: createProductMutation onError", error);
      toast.error(`Erro ao adicionar produto: ${error.message}`);
    }
  });
  
  const updateProductMutation = useMutation<Product, Error, { id: string; product: ProductFormData }>({ // Tipos
    mutationFn: (data: { id: string; product: ProductFormData }) => 
      updateProduct(data.id, data.product),
    onSuccess: (data) => {
      console.log("AdminPanel: updateProductMutation onSuccess, Data:", data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error("AdminPanel: updateProductMutation onError", error);
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    }
  });
  
  const deleteProductMutation = useMutation<void, Error, string>({ // Tipos
    mutationFn: deleteProduct,
    onSuccess: () => {
      console.log("AdminPanel: deleteProductMutation onSuccess");
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error("AdminPanel: deleteProductMutation onError", error);
      toast.error(`Erro ao excluir produto: ${error.message}`);
    }
  });
  
  // Este useEffect filtra e ordena os produtos.
  // Ele agora depende de 'products' (que deve ter 'createdat')
  useEffect(() => {
    console.log("AdminPanel: useEffect de filtro/ordenação disparado. products:", products);
    if (!products || products.length === 0) {
        setFilteredProducts([]);
        return;
    }

    let result = [...products];
    
    if (activeTab !== "todos") {
      result = result.filter(product => product.category === activeTab);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(term) || 
          product.description.toLowerCase().includes(term) ||
          product.id.toLowerCase().includes(term)
      );
    }
    
    // MODIFICADO: Ordenar por 'createdat'
    // Adicionado um check para garantir que createdat é uma data válida antes de ordenar
    result.sort((a, b) => {
        const dateA = a.createdat instanceof Date ? a.createdat.getTime() : 0;
        const dateB = b.createdat instanceof Date ? b.createdat.getTime() : 0;
        return dateB - dateA;
    });
    
    console.log("AdminPanel: setFilteredProducts chamado com:", result);
    setFilteredProducts(result);
  }, [products, activeTab, searchTerm]); // Dependências corretas
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // A busca já é tratada pelo useEffect ao mudar o searchTerm
  };
  
  const handleAddProduct = (data: ProductFormData) => {
    console.log("AdminPanel: handleAddProduct chamado com data:", data);
    createProductMutation.mutate(data);
  };
  
  const handleEditProduct = (data: ProductFormData) => {
    if (!currentProduct) return;
    console.log("AdminPanel: handleEditProduct chamado para ID:", currentProduct.id, "com data:", data);
    updateProductMutation.mutate({
      id: currentProduct.id,
      product: data
    });
  };
  
  const handleDeleteProduct = () => {
    if (!currentProduct) return;
    console.log("AdminPanel: handleDeleteProduct chamado para ID:", currentProduct.id);
    deleteProductMutation.mutate(currentProduct.id);
  };
  
  const openEditDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerencie seus produtos, estoque e vendas
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log("AdminPanel: Botão Atualizar clicado");
                  refetch();
                }}
                variant="outline"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? "Atualizando..." : "Atualizar"}
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Total de Produtos</h3>
                <span className="text-2xl font-bold">{products?.length || 0}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {products?.filter(p => p.stock <= 5).length || 0} produtos com baixo estoque
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Valor do Estoque</h3>
                <span className="text-2xl font-bold">
                  R$ {products
                    ?.reduce((sum, product) => sum + product.price * product.stock, 0)
                    .toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Baseado no preço original sem descontos
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Produtos em Destaque</h3>
                <span className="text-2xl font-bold">{products?.filter(p => p.featured).length || 0}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {products?.filter(p => p.discount && p.discount > 0).length || 0} produtos com desconto
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold">Gerenciamento de Produtos</h2>
              
              <form onSubmit={handleSearch} className="w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar produtos..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </form>
            </div>
            
            <Tabs 
              defaultValue="todos" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="porta-medalhas">Porta Medalhas</TabsTrigger>
                <TabsTrigger value="trofeus">Troféus</TabsTrigger>
                <TabsTrigger value="medalhas">Medalhas</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isLoading && !isFetchError ? ( // Mostrar loading apenas se não houver erro de fetch inicial
              <div className="text-center py-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-center">Destaque</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.id.substring(0, 6)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                                <img
                                  src={product.imageUrl || "/placeholder.svg"}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.discount ? (
                                    <span className="text-red-600">-{product.discount}%</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CategoryBadge category={product.category} />
                          </TableCell>
                          <TableCell className="text-right">
                            {product.discount ? (
                              <div className="flex flex-col items-end">
                                <span className="line-through text-muted-foreground text-sm">
                                  R$ {product.price.toFixed(2)}
                                </span>
                                <span className="font-medium">
                                  R$ {(product.price - (product.price * (product.discount || 0) / 100)).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span>R$ {product.price.toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <StockBadge stock={product.stock} />
                          </TableCell>
                          <TableCell className="text-center">
                            {product.featured ? (
                              <Badge variant="default" className="bg-sport-gold text-sport-dark">
                                Destaque
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => openEditDialog(product)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(product)}
                                  className="text-red-600 focus:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {isFetchError ? "Erro ao carregar produtos." : "Nenhum produto encontrado."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Adicionar Produto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo produto. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          
          <ProductForm 
            onSubmit={handleAddProduct}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize os detalhes do produto. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          
          {currentProduct && (
            <ProductForm 
              initialData={currentProduct}
              onSubmit={handleEditProduct}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto{" "}
              <strong>{currentProduct?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteProductMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "Excluindo..." : "Excluir Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components (mantidos como antes)
function CategoryBadge({ category }: { category: string }) {
  let icon;
  let label = "";
  let variant: "default" | "secondary" | "outline" = "outline";
  
  switch (category) {
    case "porta-medalhas":
      icon = <Medal className="h-3 w-3 mr-1" />;
      label = "Porta Medalhas";
      variant = "secondary";
      break;
    case "trofeus":
      icon = <Trophy className="h-3 w-3 mr-1" />;
      label = "Troféus";
      variant = "default";
      break;
    default:
      label = category;
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="flex items-center gap-1 w-fit">
      {icon}
      {label}
    </Badge>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive" className="w-fit mx-auto">Sem estoque</Badge>;
  } else if (stock <= 5) {
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600 w-fit mx-auto">{stock} restantes</Badge>;
  } else {
    return <Badge variant="outline" className="border-green-500 text-green-600 w-fit mx-auto">{stock} em estoque</Badge>;
  }
}