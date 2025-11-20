import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveProducts } from '@/lib/db';
import { Product } from '@/types/product';

interface ImportDialogProps {
  onImportComplete: () => void;
}

export function ImportDialog({ onImportComplete }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Debug: mostrar las columnas encontradas en la consola
      if (jsonData.length > 0) {
        console.log('Columnas encontradas en el Excel:', Object.keys(jsonData[0]));
      }

      // Map and validate data
      const products: Product[] = jsonData.map((row) => ({
        codigo: String(row.codigo || row.Codigo || row.CODIGO || row.Código || row.CÓDIGO || '').trim(),
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
      })).filter(p => p.codigo && p.descripcion); // Filter out invalid entries

      if (products.length === 0) {
        throw new Error('No se encontraron productos válidos en el archivo');
      }

      await saveProducts(products);

      toast({
        title: 'Importación exitosa',
        description: `Se importaron ${products.length} productos correctamente`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error) {
      console.error('Error importing file:', error);
      toast({
        title: 'Error al importar',
        description: error instanceof Error ? error.message : 'Verifica que el archivo tenga las columnas: codigo, descripcion, ubicacion, stock',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Base de Datos</DialogTitle>
          <DialogDescription>
            Selecciona un archivo Excel (.xlsx) con las columnas: codigo, descripcion, ubicacion, stock
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            
            <label htmlFor="file-upload">
              <Button
                variant="default"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {importing ? 'Importando...' : 'Seleccionar archivo'}
              </Button>
            </label>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>El archivo debe contener las columnas: <strong>codigo</strong>, <strong>descripcion</strong>, <strong>ubicacion</strong>, <strong>stock</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <p>La importación reemplazará todos los datos existentes</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
