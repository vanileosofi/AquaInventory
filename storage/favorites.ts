// storage/favorites.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type FavoriteType = 'mix' | 'technical' | 'compatible' | 'found' | 'detected';

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
 * Determina si un item es duplicado dentro de una lista según las reglas:
 * - Con marca: mismo hex + misma marca + mismo type.
 * - Sin marca (mezclas): mismo name + mismo type.
 */
export function isDuplicateInList(
  item: Pick<FavoriteItem, 'hex' | 'name' | 'brand' | 'type'>,
  existingItems: FavoriteItem[]
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase();
  if (item.brand) {
    return existingItems.some(
      (i) =>
        i.type === item.type &&
        normalize(i.hex ?? '') === normalize(item.hex ?? '') &&
        normalize(i.brand ?? '') === normalize(item.brand!)
    );
  }
  return existingItems.some(
    (i) => i.type === item.type && normalize(i.name) === normalize(item.name)
  );
}

/**
 * Devuelve los IDs de las listas donde el item ya existe como duplicado.
 */
export async function getListIdsContainingItem(
  item: Pick<FavoriteItem, 'hex' | 'name' | 'brand' | 'type'>
): Promise<string[]> {
  const [lists, allItems] = await Promise.all([getFavoriteLists(), getFavoriteItems()]);
  return lists
    .filter((list) => isDuplicateInList(item, allItems.filter((i) => i.listId === list.id)))
    .map((list) => list.id);
}

/**
 * Elimina de una lista el item que coincide con las reglas de duplicado.
 */
export async function deleteMatchingItemFromList(
  listId: string,
  item: Pick<FavoriteItem, 'hex' | 'name' | 'brand' | 'type'>
): Promise<void> {
  const items = await getFavoriteItems();
  const toDelete = items
    .filter((i) => i.listId === listId)
    .filter((i) => isDuplicateInList(item, [i]))
    .map((i) => i.id);
  if (toDelete.length === 0) return;
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items.filter((i) => !toDelete.includes(i.id))));
}

/**
 * Guarda un item en una lista.
 * Si el item ya existe como duplicado en esa lista, lo omite silenciosamente.
 */
export async function saveItemToList(
  listId: string,
  item: Omit<FavoriteItem, 'id' | 'listId' | 'savedAt' | 'notes'>
): Promise<FavoriteItem | null> {
  const items = await getFavoriteItems();
  const itemsInList = items.filter((i) => i.listId === listId);

  if (isDuplicateInList(item, itemsInList)) return null;

  const newItem: FavoriteItem = {
    ...item,
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
 * Omite silenciosamente las listas donde el item ya existe como duplicado.
 * Devuelve solo los items efectivamente guardados.
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
      ...newItems.filter((i) => i.listId === listId),
    ];

    if (isDuplicateInList(item, itemsInList)) continue;

    const newItem: FavoriteItem = {
      ...item,
      id: `${Date.now()}_${listId}`,
      listId,
      notes: '',
      savedAt: Date.now(),
    };

    newItems.push(newItem);
  }

  if (newItems.length > 0) {
    await AsyncStorage.setItem(
      ITEMS_KEY,
      JSON.stringify([...allItems, ...newItems])
    );
  }
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