
import { useState } from "react";
import { CartItem as CartItemType } from "@/types/Product";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}

export function CartItem({ item, updateQuantity, removeItem }: CartItemProps) {
  const { product, quantity, productId } = item;
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleIncrease = () => {
    setIsUpdating(true);
    updateQuantity(productId, quantity + 1);
    setTimeout(() => setIsUpdating(false), 300);
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      setIsUpdating(true);
      updateQuantity(productId, quantity - 1);
      setTimeout(() => setIsUpdating(false), 300);
    }
  };
  
  const handleRemove = () => {
    removeItem(productId);
  };
  
  const finalPrice = product.discount 
    ? product.price - (product.price * product.discount / 100) 
    : product.price;
  
  const totalPrice = finalPrice * quantity;
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-md">
      <Link 
        to={`/produto/${product.id}`} 
        className="flex-shrink-0 h-24 w-24 bg-muted rounded overflow-hidden"
      >
        <img 
          src={product.imageUrl || "/placeholder.svg"} 
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </Link>
      
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
          <Link to={`/produto/${product.id}`}>
            <h3 className="font-medium">{product.name}</h3>
          </Link>
          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-center gap-2">
              {product.discount ? (
                <>
                  <span className="text-muted-foreground line-through text-sm">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="font-medium">
                    R$ {finalPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-medium">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>
            <p className="font-bold text-primary mt-1">
              Total: R$ {totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecrease}
              disabled={quantity <= 1 || isUpdating}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrease}
              disabled={isUpdating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:text-destructive/80"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span>Remover</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
