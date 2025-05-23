import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Removido: import { useEffect } from "react"; (se não for mais usado para outros fins)
// Removido: import { initializeDatabase } from "./lib/initializeDatabase"; (se este era o único uso)
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import AllProducts from "./pages/AllProducts";

const queryClient = new QueryClient();

const App = () => {
  // Removido o useEffect que chamava initializeDatabase()
  // useEffect(() => {
  //   // Initialize the database when the app starts
  //   initializeDatabase().catch(console.error);
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/produto/:productId" element={<ProductDetail />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/categorias/:categoryId" element={<CategoryPage />} />
            <Route path="/produtos" element={<AllProducts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;