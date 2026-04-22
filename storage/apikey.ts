import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'ai_api_key';
const OLD_KEY = 'anthropic_api_key';
const MODEL_KEY = 'aqua_ai_model';

export async function getApiKey(): Promise<string> {
  // Migrate from old key if exists
  const old = await AsyncStorage.getItem(OLD_KEY);
  if (old) {
    await SecureStore.setItemAsync(KEY, old.trim());
    await AsyncStorage.removeItem(OLD_KEY);
  }
  return (await SecureStore.getItemAsync(KEY)) ?? '';
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, key.trim());
  await AsyncStorage.removeItem(OLD_KEY); // clean up old key if still present
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

// ─── Model ────────────────────────────────────────────────────────────────────

export interface AiModel {
  id: string;
  label: string;
}

export const AI_MODELS: AiModel[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export async function getModel(): Promise<string> {
  return (await AsyncStorage.getItem(MODEL_KEY)) ?? DEFAULT_MODEL;
}

export async function saveModel(modelId: string): Promise<void> {
  await AsyncStorage.setItem(MODEL_KEY, modelId);
}
