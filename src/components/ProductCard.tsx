import { Package, MapPin, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockStatus = product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'destructive';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Código del artículo */}
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="font-mono font-semibold text-foreground">{product.codigo}</span>
          </div>

          {/* Descripción del artículo */}
          <div>
            <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">
              {product.descripcion}
            </h3>
          </div>

          {/* Cantidad de stock */}
          <div className="flex items-center gap-2">
            <Badge variant={stockStatus === 'success' ? 'default' : stockStatus === 'warning' ? 'outline' : 'destructive'}>
              Stock: {product.stock}
            </Badge>
          </div>

          {/* Código de ubicación */}
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md border border-primary/20">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Ubicación</span>
              <span className="font-semibold text-foreground">
                {product.ubicacion || 'Sin ubicación'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
