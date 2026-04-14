import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'anthropic_api_key';

export async function getApiKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) ?? '';
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}