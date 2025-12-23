import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "@/lib/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: number, size: string, quantity: number) => void;
  onRemove: (id: number, size: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 items-center border rounded-lg p-4">
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 object-cover rounded"
      />

      <div className="flex-grow">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
        <p className="text-primary">${item.price}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.id, item.size, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.id, item.size, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id, item.size)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
