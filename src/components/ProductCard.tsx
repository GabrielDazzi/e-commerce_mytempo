
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types/Product";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  addToCart?: (product: Product) => void;
}

export function ProductCard({ product, addToCart }: ProductCardProps) {
  const { id, name, price, imageUrl, discount } = product;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCart) {
      addToCart(product);
      toast.success(`${name} adicionado ao carrinho!`);
    }
  };
  
  const finalPrice = discount ? price - (price * discount / 100) : price;
  
  return (
    <Link to={`/produto/${id}`}>
      <Card className="overflow-hidden hover-scale border h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
          {discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 text-xs font-medium rounded">
              -{discount}%
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="font-medium line-clamp-2 min-h-[40px]">{name}</h3>
          <div className="mt-2 flex items-end">
            {discount ? (
              <div className="flex flex-col">
                <span className="text-muted-foreground line-through text-sm">
                  R$ {price.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-primary">
                  R$ {finalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                R$ {price.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full gap-2"
            variant="secondary" 
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Adicionar</span>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ProductCard;
