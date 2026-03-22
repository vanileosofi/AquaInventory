import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveColor(color: Omit<Color, 'id' | 'createdAt' | 'updatedAt'>): Promise<Color> {
  const colors = await getColors();
  const newColor: Color = {
    ...color,
    id: Date.now().toString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...colors, newColor]));
  return newColor;
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