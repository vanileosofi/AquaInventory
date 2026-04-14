import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getApiKey } from '../storage/apikey';

interface ColorSuggestion {
  name: string;
  hex: string;
  description: string;
}

interface Props {
  name: string;
  brand: string;
  code: string;
  onSelect: (hex: string) => void;
  buttonLabel?: string;
}

export default function ColorAISearch({ name, brand, code, onSelect, buttonLabel }: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<ColorSuggestion[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      setError(t('color_ai.no_api_key'));
      setModalVisible(true);
      return;
    }

    if (!name.trim() && !brand.trim() && !code.trim()) {
      setError(t('color_ai.no_input'));
      setModalVisible(true);
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);
    setModalVisible(true);

    try {
      const lang = i18n.language;
      const prompt = lang === 'es'
        ? `Eres un experto en acuarelas. Basándote en la siguiente información sobre una acuarela, sugiere 2-3 posibles colores hex que mejor representen esta pintura.

Información:
- Nombre: ${name || 'desconocido'}
- Marca: ${brand || 'desconocida'}
- Código: ${code || 'desconocido'}

Responde ÚNICAMENTE con un array JSON, sin backticks ni texto extra:
[
  {
    "name": "nombre del color",
    "hex": "#rrggbb",
    "description": "descripción breve del color en español"
  }
]`
        : `You are a watercolor paint expert. Based on the following information about a watercolor paint, suggest 2-3 possible hex colors that best represent this paint.

Info:
- Name: ${name || 'unknown'}
- Brand: ${brand || 'unknown'}
- Code: ${code || 'unknown'}

Respond ONLY with a JSON array, no backticks or extra text:
[
  {
    "name": "color name",
    "hex": "#rrggbb",
    "description": "brief description of the color in English"
  }
]`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = (err as any)?.error?.message || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('Empty response from Gemini');

      const clean = text.replace(/```json\s*|```/gi, '').trim();
      console.log('ColorAI response:', clean);

      const firstBracket = clean.indexOf('[');
      const lastBracket = clean.lastIndexOf(']');
      if (firstBracket === -1 || lastBracket === -1) throw new Error('No JSON array found');
      const parsed: ColorSuggestion[] = JSON.parse(clean.substring(firstBracket, lastBracket + 1));
      setSuggestions(parsed);

    } catch (e: any) {
      console.error('ColorAI error:', e);
      setError(t('color_ai.error') + ': ' + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: ColorSuggestion) => {
    onSelect(suggestion.hex);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={handleSearch}>
        <Text style={styles.btnText}>{buttonLabel ?? t('color_ai.ai_button')}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('color_ai.modal_title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B44AC" />
                <Text style={styles.loadingText}>{t('color_ai.loading')}</Text>
              </View>
            )}

            {error !== '' && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {!loading && suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestion} onPress={() => handleSelect(item)}>
                    <View style={[styles.suggestionSwatch, { backgroundColor: item.hex }]} />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionHex}>{item.hex}</Text>
                      <Text style={styles.suggestionDesc}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3B44AC', backgroundColor: '#f0f2ff' },
  aiButtonText: { color: '#3B44AC', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeIcon: { fontSize: 18, color: '#888', padding: 4 },
  loadingContainer: { alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 15, color: '#666' },
  errorText: { color: '#ff4444', fontSize: 15, textAlign: 'center', padding: 16 },
  suggestion: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  suggestionSwatch: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 15, fontWeight: '600', color: '#333' },
  suggestionHex: { fontSize: 13, color: '#3B44AC', marginTop: 2 },
  suggestionDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3B44AC', backgroundColor: '#f0f2ff' },
  btnText: { color: '#3B44AC', fontSize: 13, fontWeight: '600' },
});