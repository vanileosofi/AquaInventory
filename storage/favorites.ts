// storage/favorites.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type FavoriteType = 'mix' | 'technical' | 'compatible';

export interface MixStep {
  colorName: string;
  hex: string;
  proportion?: string; // ej. "2 partes", "50%"
}

export interface FavoriteItem {
  id: string;
  listId: string;          // pertenece a una sola lista
  type: FavoriteType;
  hex: string;
  name: string;            // puede tener sufijo "(2)", "(3)"...
  brand?: string;
  mix_recipe?: MixStep[];
  notes: string;
  savedAt: number;
}

export interface FavoriteList {
  id: string;
  name: string;
  createdAt: number;
}

// ─── Claves de AsyncStorage ──────────────────────────────────────────────────

const ITEMS_KEY = 'aqua_favorite_items';
const LISTS_KEY = 'aqua_favorite_lists';

// ─── Listas ──────────────────────────────────────────────────────────────────

export async function getFavoriteLists(): Promise<FavoriteList[]> {
  const raw = await AsyncStorage.getItem(LISTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function createFavoriteList(name: string): Promise<FavoriteList> {
  const lists = await getFavoriteLists();
  const newList: FavoriteList = {
    id: Date.now().toString(),
    name: name.trim(),
    createdAt: Date.now(),
  };
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify([...lists, newList]));
  return newList;
}

export async function renameFavoriteList(
  id: string,
  name: string
): Promise<void> {
  const lists = await getFavoriteLists();
  const updated = lists.map((l) =>
    l.id === id ? { ...l, name: name.trim() } : l
  );
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
}

export async function deleteFavoriteList(id: string): Promise<void> {
  // Borra la lista
  const lists = await getFavoriteLists();
  const filtered = lists.filter((l) => l.id !== id);
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(filtered));

  // Borra todos sus items
  const items = await getFavoriteItems();
  const kept = items.filter((i) => i.listId !== id);
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(kept));
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function getFavoriteItems(): Promise<FavoriteItem[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getItemsForList(listId: string): Promise<FavoriteItem[]> {
  const items = await getFavoriteItems();
  return items
    .filter((i) => i.listId === listId)
    .sort((a, b) => a.savedAt - b.savedAt);
}

/**
 * Resuelve el nombre final del item para evitar duplicados exactos en la lista.
 * Si "Gris Topo" + brand + type ya existe en esa lista, devuelve "Gris Topo (2)",
 * y así sucesivamente.
 */
function resolveItemName(
  baseName: string,
  brand: string | undefined,
  type: FavoriteType,
  existingItems: FavoriteItem[]
): string {
  const normalize = (s: string) => s.trim().toLowerCase();

  const isDuplicate = (name: string) =>
    existingItems.some(
      (i) =>
        normalize(i.name) === normalize(name) &&
        (i.brand ?? '') === (brand ?? '') &&
        i.type === type
    );

  if (!isDuplicate(baseName)) return baseName;

  let counter = 2;
  while (isDuplicate(`${baseName} (${counter})`)) {
    counter++;
  }
  return `${baseName} (${counter})`;
}

/**
 * Guarda un item en una lista.
 * Aplica la regla de nombres para evitar duplicados exactos en esa lista.
 */
export async function saveItemToList(
  listId: string,
  item: Omit<FavoriteItem, 'id' | 'listId' | 'savedAt' | 'notes'>
): Promise<FavoriteItem> {
  const items = await getFavoriteItems();
  const itemsInList = items.filter((i) => i.listId === listId);

  const resolvedName = resolveItemName(
    item.name,
    item.brand,
    item.type,
    itemsInList
  );

  const newItem: FavoriteItem = {
    ...item,
    name: resolvedName,
    id: Date.now().toString(),
    listId,
    notes: '',
    savedAt: Date.now(),
  };

  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([...items, newItem]));
  return newItem;
}

/**
 * Guarda el mismo item en múltiples listas a la vez (desde el modal de estrella).
 * Cada lista recibe su propio registro independiente.
 */
export async function saveItemToLists(
  listIds: string[],
  item: Omit<FavoriteItem, 'id' | 'listId' | 'savedAt' | 'notes'>
): Promise<FavoriteItem[]> {
  const allItems = await getFavoriteItems();
  const newItems: FavoriteItem[] = [];

  for (const listId of listIds) {
    const itemsInList = [
      ...allItems.filter((i) => i.listId === listId),
      ...newItems.filter((i) => i.listId === listId), // los que acabamos de crear en este loop
    ];

    const resolvedName = resolveItemName(
      item.name,
      item.brand,
      item.type,
      itemsInList
    );

    const newItem: FavoriteItem = {
      ...item,
      name: resolvedName,
      id: `${Date.now()}_${listId}`, // garantiza ID único si se guarda en varias listas al mismo tiempo
      listId,
      notes: '',
      savedAt: Date.now(),
    };

    newItems.push(newItem);
  }

  await AsyncStorage.setItem(
    ITEMS_KEY,
    JSON.stringify([...allItems, ...newItems])
  );
  return newItems;
}

export async function updateFavoriteItemNotes(
  id: string,
  notes: string
): Promise<void> {
  const items = await getFavoriteItems();
  const updated = items.map((i) => (i.id === id ? { ...i, notes } : i));
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
}

export async function renameFavoriteItem(
  id: string,
  name: string
): Promise<void> {
  const items = await getFavoriteItems();
  const updated = items.map((i) =>
    i.id === id ? { ...i, name: name.trim() } : i
  );
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
}

export async function deleteFavoriteItem(id: string): Promise<void> {
  const items = await getFavoriteItems();
  const filtered = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
}