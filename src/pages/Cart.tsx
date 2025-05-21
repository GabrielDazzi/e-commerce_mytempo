
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CartItem } from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, CreditCard, Truck } from "lucide-react";
import { CartItem as CartItemType, Product } from "@/types/Product";
import { toast } from "sonner";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(items);
      } catch (error) {
        console.error("Error loading cart:", error);
        toast.error("Erro ao carregar o carrinho");
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, []);
  
  const updateCart = (newItems: CartItemType[]) => {
    setCartItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    const updatedItems = cartItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    );
    updateCart(updatedItems);
    toast.success("Carrinho atualizado");
  };
  
  const removeItem = (productId: string) => {
    const updatedItems = cartItems.filter(item => item.productId !== productId);
    updateCart(updatedItems);
    toast.success("Item removido do carrinho");
  };
  
  const clearCart = () => {
    updateCart([]);
    toast.success("Carrinho limpo com sucesso");
  };
  
  const handleCheckout = () => {
    toast.success("Redirecionando para o checkout...");
    // In a real app, this would redirect to checkout
  };
  
  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => {
      const price = item.product.discount 
        ? item.product.price - (item.product.price * item.product.discount / 100) 
        : item.product.price;
      return sum + price * item.quantity;
    },
    0
  );
  
  const shipping = subtotal >= 300 ? 0 : 20; // Free shipping over R$300
  const total = subtotal + shipping;
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container flex-grow flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando carrinho...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Seu Carrinho</h1>
          
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'} no seu carrinho
                  </p>
                  <Button variant="ghost" onClick={clearCart} className="text-sm">
                    Limpar carrinho
                  </Button>
                </div>
                
                {cartItems.map((item) => (
                  <CartItem 
                    key={item.productId} 
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
                
                <div className="mt-6">
                  <Link to="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Continuar comprando
                  </Link>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Compra</CardTitle>
                    <CardDescription>
                      Revise seu pedido antes de finalizar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span>
                        {shipping === 0 
                          ? <span className="text-green-600">Grátis</span>
                          : `R$ ${shipping.toFixed(2)}`
                        }
                      </span>
                    </div>
                    
                    {shipping > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Frete grátis para compras acima de R$ 300,00
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span className="text-primary font-bold">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Em até 12x de R$ {(total / 12).toFixed(2)} sem juros
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>Entrega para todo Brasil</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span>Pagamentos seguros com criptografia</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleCheckout}>
                      Finalizar Compra
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
              <p className="text-muted-foreground mb-6">
                Parece que você ainda não adicionou produtos ao seu carrinho.
              </p>
              <Link to="/">
                <Button>Explorar Produtos</Button>
              </Link>
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
