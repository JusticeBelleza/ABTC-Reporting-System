import { openDB } from 'idb';

const DB_NAME = 'ABTC_Offline_DB';
const STORE_NAME = 'drafts';

// Initialize the IndexedDB Database
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveOfflineDraft = async (draft) => {
  const db = await initDB();
  draft.id = 'current_draft'; // We only store one master draft per facility session
  await db.put(STORE_NAME, draft);
};

export const getOfflineDraft = async () => {
  const db = await initDB();
  return db.get(STORE_NAME, 'current_draft');
};

export const clearOfflineDraft = async () => {
  const db = await initDB();
  await db.delete(STORE_NAME, 'current_draft');
};