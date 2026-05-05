import { useState, useEffect } from 'react';
import { CloudDownload, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveProducts } from '@/lib/db';
import { Product } from '@/types/product';

interface CloudSyncDialogProps {
  onSyncComplete: () => void;
}

export function CloudSyncDialog({ onSyncComplete }: CloudSyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUrl = localStorage.getItem('stockmlujan_sheet_url');
    if (savedUrl) {
      setSheetUrl(savedUrl);
    } else {
      setIsConfiguring(true);
    }
  }, []);

  const handleSaveUrl = () => {
    if (!sheetUrl.trim()) return;
    localStorage.setItem('stockmlujan_sheet_url', sheetUrl.trim());
    setIsConfiguring(false);
    toast({ title: 'Enlace guardado', description: 'Ya podés sincronizar los datos.' });
  };

  // Parsear CSV texto plano a array de objetos
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce((obj: any, header, i) => {
        obj[header] = values[i] ?? '';
        return obj;
      }, {});
    });
  };

  const handleSync = async () => {
    if (!sheetUrl) {
      setIsConfiguring(true);
      return;
    }

    setSyncing(true);
    toast({ title: 'Sincronizando...', description: 'Descargando base de datos desde la nube.' });

    try {
      // Normalizar la URL: si ya es un enlace CSV publicado, usarla tal cual
      let fetchUrl = sheetUrl.trim();
      const isCsvLink = fetchUrl.includes('/pub') || fetchUrl.includes('output=csv');

      if (!isCsvLink && fetchUrl.includes('/d/')) {
        const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1] && idMatch[1] !== 'e') {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
      }

      // Intentar fetch directo, si falla por CORS usar proxy
      let csvText: string | null = null;

      try {
        const directResponse = await fetch(fetchUrl);
        if (directResponse.ok) {
          csvText = await directResponse.text();
        }
      } catch {
        // Ignorar error de CORS, intentar con proxy
      }

      if (!csvText) {
        // Fallback: usar proxy CORS público
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`Error HTTP: ${proxyResponse.status}. Verificá que el enlace sea público (Publicado en la web).`);
        }
        csvText = await proxyResponse.text();
      }

      if (!csvText || csvText.trim().length === 0) {
        throw new Error('La hoja de cálculo está vacía o no se pudo leer.');
      }

      const jsonData = parseCSV(csvText);

      const products: Product[] = jsonData.map((row) => ({
        codigo: String(row.codigo || row.Codigo || row.CODIGO || row.Código || row.CÓDIGO || row.ID || '').trim(),
        descripcion: String(row.descripcion || row.Descripcion || row.DESCRIPCION || row.Descripción || row.DESCRIPCIÓN || '').trim(),
        ubicacion: String(
          row.ubicacion || row.Ubicacion || row.UBICACION || 
          row.ubicación || row.Ubicación || row.UBICACIÓN ||
          row.deposito || row.Deposito || row.DEPOSITO ||
          row.depósito || row.Depósito || row.DEPÓSITO ||
          row.ubic || row.Ubic || row.UBIC ||
          ''
        ).trim(),
        stock: Number(row.stock || row.Stock || row.STOCK || 0),
      })).filter(p => p.codigo && p.descripcion);

      if (products.length === 0) {
        throw new Error('No se encontraron productos válidos o las columnas no coinciden.');
      }

      await saveProducts(products);

      toast({
        title: 'Sincronización exitosa',
        description: `Se actualizaron ${products.length} productos correctamente desde la nube.`,
      });

      setOpen(false);
      onSyncComplete();
    } catch (error) {
      console.error('Error syncing file:', error);
      toast({
        title: 'Error al sincronizar',
        description: error instanceof Error ? error.message : 'Error desconocido. Verificá tu enlace o archivo.',
        variant: 'destructive',
      });
      // Si falló, posiblemente sea un error de CORS o link malo, abrimos config
      setIsConfiguring(true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white border-0 shadow-sm transition-colors">
          <CloudDownload className="mr-2 h-4 w-4" />
          Nube
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronización con Google Sheets</DialogTitle>
          <DialogDescription>
            Descargá los últimos datos del stock en vivo desde tu hoja de cálculo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {(!sheetUrl || isConfiguring) ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enlace de publicación (CSV):</label>
                <Input 
                  placeholder="https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm leading-tight">
                <p className="font-semibold text-foreground">¿Cómo obtener este enlace?</p>
                <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                  <li>Abrí tu Excel en Google Sheets.</li>
                  <li>Andá a <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong>.</li>
                  <li>Elegí la hoja o documento, y en formato cambiá a <strong>Valores separados por comas (.csv)</strong>.</li>
                  <li>Hacé clic en Publicar y pegá ese enlace aquí.</li>
                </ol>
              </div>

              <div className="flex justify-end gap-2">
                {sheetUrl && <Button variant="ghost" onClick={() => setIsConfiguring(false)}>Cancelar</Button>}
                <Button onClick={handleSaveUrl}>Guardar Configuración</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center pb-4">
              <CloudDownload className="mx-auto h-16 w-16 text-sky-500 mb-4" />
              <p className="text-sm text-muted-foreground">
                Tu aplicación está enlazada al documento de la nube. Al sincronizar se reemplazará la base de datos actual con los datos más recientes.
              </p>
              
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setIsConfiguring(true)}>
                  <Settings className="mr-2 h-4 w-4" /> Configurar
                </Button>
                <Button onClick={handleSync} disabled={syncing} className="bg-sky-500 hover:bg-sky-600 text-white">
                  <CloudDownload className={`mr-2 h-4 w-4 ${syncing ? 'animate-bounce' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
