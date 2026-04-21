import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const STORAGE_KEY = 'aqua_colors';

export interface Color {
  id: string;
  name: string;
  brand: string;
  code: string;
  series: string;
  format: 'pan' | 'tube';
  lightfast: number;
  transparency: string;
  inUse: boolean;
  quantity: 'full' | 'half' | 'low' | 'empty';
  spare: number;
  notes: string;
  hex: string;
  createdAt: number;
  updatedAt: number;
}

export async function getColors(): Promise<Color[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveColor(color: Omit<Color, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; duplicate: boolean }> {
  const colors = await getColors();
  const isDuplicate = colors.some(
    c =>
      c.name.toLowerCase() === color.name.toLowerCase() &&
      c.code.toLowerCase() === color.code.toLowerCase() &&
      c.brand.toLowerCase() === color.brand.toLowerCase() &&
      c.format === color.format
  );
  if (isDuplicate) return { success: false, duplicate: true };
  const newColor: Color = {
    ...color,
    id: Date.now().toString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...colors, newColor]));
  return { success: true, duplicate: false };
}

export async function deleteColor(id: string): Promise<void> {
  const colors = await getColors();
  const updated = colors.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function updateColor(id: string, data: Omit<Color, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const colors = await getColors();
  const updated = colors.map(c =>
    c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c
  );
  await AsyncStorage.setItem('aqua_colors', JSON.stringify(updated));
}

export async function exportColors(): Promise<boolean> {
  try {
    const colors = await getColors();
    const data = {
      version: '1.2',
      exported_at: new Date().toISOString(),
      colors,
    };
    const json = JSON.stringify(data, null, 2);
    const fileName = `aquainventory-backup-${new Date().toISOString().slice(0,10)}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, json);
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Guardar AquaInventory Backup',
        UTI: 'public.json',
      });
    }
    return true;
  } catch (e) {
    console.error('Export error:', e);
    return false;
  }
}

export async function migrateQuantityFix(): Promise<void> {
  const colors = await getColors();
  const fixed = colors.map(c => {
    if (!c.inUse && c.quantity === 'empty') {
      return { ...c, quantity: 'full' as const, updatedAt: Date.now() };
    }
    return c;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
}

export async function importColors(mode: 'replace' | 'merge'): Promise<boolean> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return false;
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const data = JSON.parse(content);
    if (!data.colors || !Array.isArray(data.colors)) return false;

    if (mode === 'replace') {
      await AsyncStorage.setItem('aqua_colors', JSON.stringify(data.colors));
    } else {
      const existing = await getColors();
      const incoming: Color[] = data.colors;
      const merged = [...existing];
      for (const color of incoming) {
        const isDuplicate = existing.some(
          c =>
            c.name.toLowerCase() === color.name.toLowerCase() &&
            c.code.toLowerCase() === color.code.toLowerCase() &&
            c.brand.toLowerCase() === color.brand.toLowerCase() &&
            c.format === color.format
        );
        if (!isDuplicate) merged.push(color);
      }
      await AsyncStorage.setItem('aqua_colors', JSON.stringify(merged));
    }
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}