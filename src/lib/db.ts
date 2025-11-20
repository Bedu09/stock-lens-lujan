import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product } from '@/types/product';

interface StockDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-descripcion': string; 'by-codigo': string };
  };
}

const DB_NAME = 'stockMLujan';
const STORE_NAME = 'products';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<StockDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<StockDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StockDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'codigo' });
        store.createIndex('by-descripcion', 'descripcion');
        store.createIndex('by-codigo', 'codigo');
      }
    },
  });

  return dbInstance;
}

export async function saveProducts(products: Product[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  
  // Clear existing data
  await tx.store.clear();
  
  // Add new products
  for (const product of products) {
    await tx.store.add(product);
  }
  
  await tx.done;
}

export async function searchProducts(
  searchCodigo: string,
  searchDescripcion: string
): Promise<Product[]> {
  const db = await getDB();
  const allProducts = await db.getAll(STORE_NAME);

  if (!searchCodigo && !searchDescripcion) {
    return allProducts;
  }

  return allProducts.filter((product) => {
    const codigoMatch = searchCodigo
      ? product.codigo.toLowerCase().includes(searchCodigo.toLowerCase())
      : true;

    const descripcionMatch = searchDescripcion
      ? product.descripcion.toLowerCase().includes(searchDescripcion.toLowerCase())
      : true;

    return codigoMatch && descripcionMatch;
  });
}

export async function getProductCount(): Promise<number> {
  const db = await getDB();
  return await db.count(STORE_NAME);
}
