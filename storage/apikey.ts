import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'anthropic_api_key';
const MODEL_KEY = 'aqua_ai_model';

export async function getApiKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) ?? '';
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
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
