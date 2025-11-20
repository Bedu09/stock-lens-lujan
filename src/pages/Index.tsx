import { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImportDialog } from '@/components/ImportDialog';
import { ProductCard } from '@/components/ProductCard';
import { searchProducts, getProductCount } from '@/lib/db';
import { Product } from '@/types/product';

const Index = () => {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadProductCount();
  }, []);

  const loadProductCount = async () => {
    const count = await getProductCount();
    setProductCount(count);
  };

  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    
    try {
      const products = await searchProducts(codigo, descripcion);
      setResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleImportComplete = () => {
    loadProductCount();
    setResults([]);
    setCodigo('');
    setDescripcion('');
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">StockMLuján</h1>
                <p className="text-sm text-primary-foreground/80">Sistema de Gestión de Inventario</p>
              </div>
            </div>
            <ImportDialog onImportComplete={handleImportComplete} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-card rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Buscar Artículo</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-foreground mb-2">
                  Descripción
                </label>
                <Input
                  id="descripcion"
                  placeholder="Ej: Tornillo, Tuerca, Cable..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-foreground mb-2">
                  Código
                </label>
                <Input
                  id="codigo"
                  placeholder="Ej: ABC-123, 456..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={searching || (!codigo && !descripcion)}
                className="w-full"
                size="lg"
              >
                <Search className="mr-2 h-5 w-5" />
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {productCount > 0 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Base de datos: {productCount} productos
              </p>
            )}
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Resultados {results.length > 0 && `(${results.length})`}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="bg-card rounded-lg shadow-md p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  No se encontraron artículos
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((product) => (
                  <ProductCard key={product.codigo} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSearched && productCount === 0 && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Base de datos vacía
              </h3>
              <p className="text-muted-foreground mb-4">
                Importa un archivo Excel para comenzar a buscar productos
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
