
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Menu, X, Search, Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="flex items-center font-bold text-lg">
                  <Trophy className="h-5 w-5 text-sport-gold mr-2" />
                  <span className="font-semibold">TrophySports</span>
                </Link>
                <nav className="flex flex-col gap-2">
                  <Link to="/" className="px-2 py-1 hover:bg-muted rounded-md">Início</Link>
                  <Link to="/categorias/medalhas" className="px-2 py-1 hover:bg-muted rounded-md">Porta Medalhas</Link>
                  <Link to="/categorias/trofeus" className="px-2 py-1 hover:bg-muted rounded-md">Troféus</Link>
                  <Link to="/admin" className="px-2 py-1 hover:bg-muted rounded-md">Painel Admin</Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sport-gold" />
            <span className="font-bold text-xl hidden md:inline-block">TrophySports</span>
          </Link>
        </div>
        
        {!isMobile && (
          <nav className="mx-6 hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium hover:text-primary ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
              Início
            </Link>
            <Link to="/categorias/medalhas" className={`text-sm font-medium hover:text-primary ${location.pathname.includes('medalhas') ? 'text-primary' : 'text-muted-foreground'}`}>
              Porta Medalhas
            </Link>
            <Link to="/categorias/trofeus" className={`text-sm font-medium hover:text-primary ${location.pathname.includes('trofeus') ? 'text-primary' : 'text-muted-foreground'}`}>
              Troféus
            </Link>
            <Link to="/admin" className={`text-sm font-medium hover:text-primary ${location.pathname.includes('admin') ? 'text-primary' : 'text-muted-foreground'}`}>
              Painel Admin
            </Link>
          </nav>
        )}
        
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Buscar produtos..."
                className="w-full md:w-[200px] lg:w-[300px]"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>
          )}
          
          <Link to="/carrinho">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Carrinho</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
