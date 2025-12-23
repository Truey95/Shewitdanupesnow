import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    price: string | number;
    imageUrl: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // Convert price to number if it's a string
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="cursor-pointer group">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-primary">${price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}