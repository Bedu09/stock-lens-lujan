import { useState, useEffect } from 'react';
import { Search, Package, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CloudSyncDialog } from '@/components/CloudSyncDialog';
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
  const [isListening, setIsListening] = useState(false);

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

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta búsqueda por voz");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Escuchando...", { icon: "🎤" });
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setDescripcion(transcript);
      
      setSearching(true);
      setHasSearched(true);
      try {
        // Delegamos a searchProducts con el transcript completo.
        // La función ya usa coincidencia por palabras completas (no substring parcial).
        let finalResults = await searchProducts('', transcript);

        setResults(finalResults);

        if (finalResults.length > 0) {
           const locs = Array.from(new Set(finalResults.map(r => {
             const match = r.ubicacion.match(/Dep\s*([A-Za-z0-9]+)\s*-\s*(\d+)\s*-\s*(\d+)/i);
             if (match) {
               return `Depósito ${match[1]}, estantería ${match[2]}, fila ${match[3]}`;
             }
             return r.ubicacion;
           }))).join(" y ");
           const itemName = finalResults.length === 1 ? finalResults[0].descripcion : "los artículos";
           const msg = `Encontré ${itemName}. Están en ${locs}`;
           
           toast.success(msg);
           const utterance = new SpeechSynthesisUtterance(msg);
           utterance.lang = 'es-AR';
           window.speechSynthesis.speak(utterance);
        } else {
           const msg = "No encontré ningún artículo que coincida con tu búsqueda.";
           toast.error(msg);
           const utterance = new SpeechSynthesisUtterance(msg);
           utterance.lang = 'es-AR';
           window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      toast.error("Error al escuchar. Intenta de nuevo.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
            <CloudSyncDialog onSyncComplete={handleImportComplete} />
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

              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={searching || (!codigo && !descripcion)}
                  className="flex-1"
                  size="lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  {searching ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button
                  type="button"
                  onClick={handleVoiceSearch}
                  disabled={isListening}
                  variant={isListening ? "destructive" : "outline"}
                  size="lg"
                  className="px-4 shrink-0 transition-all duration-300"
                  title="Búsqueda por voz"
                >
                  <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
                </Button>
              </div>
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
