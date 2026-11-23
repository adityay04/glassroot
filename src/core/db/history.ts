import { openDB, IDBPDatabase } from 'idb';
import { ScanResult } from '../../types';

export interface ScanRecord {
  id: string;
  timestamp: number;
  projectName: string;
  results: ScanResult[];
}

const DB_NAME = 'glassroot_db';
const STORE_NAME = 'scans';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveScan = async (record: ScanRecord) => {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, record);
  } catch (err) {
    console.error('Failed to save scan to history', err);
  }
};

export const getScans = async (): Promise<ScanRecord[]> => {
  try {
    const db = await getDB();
    const scans = await db.getAll(STORE_NAME);
    return scans.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Failed to get scans', err);
    return [];
  }
};

export const deleteScan = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch (err) {
    console.error('Failed to delete scan', err);
  }
};

export const clearHistory = async () => {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (err) {
    console.error('Failed to clear history', err);
  }
};