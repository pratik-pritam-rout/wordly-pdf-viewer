const DATABASE_NAME = "wordly-pdfs";
const STORE_NAME = "documents";
const DATABASE_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function listSavedPdfs() {
  const records = await withStore("readonly", (store) => store.getAll());
  return records
    .map(({ blob, ...metadata }) => metadata)
    .sort((first, second) => second.savedAt - first.savedAt);
}

export async function savePdf(file) {
  const savedAt = Date.now();
  const records = await withStore("readonly", (store) => store.getAll());
  const existing = records.find(
    (record) =>
      record.name === file.name &&
      record.size === file.size &&
      record.lastModified === file.lastModified
  );
  const record = {
    id: existing?.id || window.crypto?.randomUUID?.() || `${savedAt}-${Math.random()}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified || savedAt,
    savedAt,
    lastPage: existing?.lastPage || 1,
    blob: file,
  };
  await withStore("readwrite", (store) => store.put(record));
  return record;
}

export const getSavedPdf = (id) => withStore("readonly", (store) => store.get(id));

export const deleteSavedPdf = (id) => withStore("readwrite", (store) => store.delete(id));

export async function updateSavedPdfPage(id, lastPage) {
  const record = await getSavedPdf(id);
  if (!record) return;
  await withStore("readwrite", (store) => store.put({ ...record, lastPage }));
}
