import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AI_MODELS, AiModel, clearApiKey, getApiKey, getModel, saveApiKey, saveModel } from '../storage/apikey';
import { exportColors, importColors } from '../storage/colors';
import { showError } from '../utils/alert';


export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [showModelModal, setShowModelModal] = useState(false);

  useEffect(() => {
    getApiKey().then((key) => {
      const value = key ?? '';
      setApiKey(value);
      setSavedApiKey(value);
    });
    getModel().then(setSelectedModel);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert(t('common.error'), t('settings.api_key_empty'));
      return;
    }
    await saveApiKey(apiKey);
    setSavedApiKey(apiKey);
    Alert.alert('✅', t('settings.api_key_saved'));
  };

  const handleClearApiKey = async () => {
    await clearApiKey();
    setApiKey('');
    setSavedApiKey('');
    Alert.alert('✅', t('settings.api_key_cleared'));
  };

  const handleSelectModel = async (model: AiModel) => {
    await saveModel(model.id);
    setSelectedModel(model.id);
    setShowModelModal(false);
  };

  const handleExport = async () => {
    const success = await exportColors();
    if (success) Alert.alert('✅', t('settings.export_success'));
    else showError(t('settings.export_error'));
  };

  const handleImport = async () => {
    Alert.alert(
      t('settings.import'),
      t('settings.import_mode'),
      [
        {
          text: t('settings.import_replace'),
          style: 'destructive',
          onPress: async () => {
            const success = await importColors('replace');
            if (success) Alert.alert('✅', t('settings.import_success'));
            else showError(t('settings.import_error'));
          },
        },
        {
          text: t('settings.import_merge'),
          onPress: async () => {
            const success = await importColors('merge');
            if (success) Alert.alert('✅', t('settings.import_success'));
            else showError(t('settings.import_error'));
          },
        },
        { text: t('color.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('user-language', lang);
    setCurrentLang(lang);
  };

  const currentModelLabel =
    AI_MODELS.find(m => m.id === selectedModel)?.label ?? selectedModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* Data */}
        <Text style={styles.section}>{t('settings.data')}</Text>
        <TouchableOpacity style={styles.row} onPress={handleExport}>
          <Text style={styles.rowText}>📤 {t('settings.export')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleImport}>
          <Text style={styles.rowText}>📥 {t('settings.import')}</Text>
        </TouchableOpacity>

        {/* AI Integration */}
        <Text style={styles.section}>{t('settings.api')}</Text>

        {/* Model selector row */}
        <TouchableOpacity style={styles.row} onPress={() => setShowModelModal(true)}>
          <Text style={styles.rowText}>🤖 {t('settings.model')}</Text>
          <View style={styles.modelRight}>
            <Text style={styles.modelValue}>{currentModelLabel}</Text>
            <ChevronRight size={16} color="#bbb" />
          </View>
        </TouchableOpacity>

        {/* API Key */}
        <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
          <Text style={styles.apiKeyLabel}>🔑 {t('settings.api_key')}</Text>
          <TextInput
            style={styles.apiInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={t('settings.api_key_placeholder')}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.apiButtons}>
            <TouchableOpacity
              style={[styles.apiSaveBtn, apiKey === savedApiKey && styles.apiSaveBtnDisabled]}
              onPress={handleSaveApiKey}
              disabled={apiKey === savedApiKey}
            >
              <Text style={styles.apiSaveBtnText}>{t('settings.api_key_save')}</Text>
            </TouchableOpacity>
            {apiKey.length > 0 && (
              <TouchableOpacity onPress={handleClearApiKey}>
                <Text style={styles.apiClearText}>{t('settings.api_key_clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Language */}
        <Text style={styles.section}>{t('settings.preferences')}</Text>
        <TouchableOpacity style={styles.row} onPress={() => handleLanguage('es')}>
          <Text style={styles.rowText}>🇪🇸 {t('settings.language_es')}</Text>
          {currentLang === 'es' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => handleLanguage('en')}>
          <Text style={styles.rowText}>🇬🇧 {t('settings.language_en')}</Text>
          {currentLang === 'en' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>

        {/* Dev */}
        <Text style={styles.section}>Dev</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/dev-seed' as any)}>
          <Text style={styles.rowText}>🔧 {t('settings.dev_tools')}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Model picker modal */}
      <Modal
        visible={showModelModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModelModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModelModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('settings.model')}</Text>
            {AI_MODELS.map(model => (
              <TouchableOpacity
                key={model.id}
                style={styles.modelOption}
                onPress={() => handleSelectModel(model)}
              >
                <Text style={[
                  styles.modelOptionText,
                  selectedModel === model.id && styles.modelOptionTextActive,
                ]}>
                  {model.label}
                </Text>
                {selectedModel === model.id && (
                  <Text style={styles.modelCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowModelModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('color.cancel')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  rowText: { fontSize: 16, color: '#333' },
  check: { color: '#3B44AC', fontSize: 16, fontWeight: '600' },

  modelRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modelValue: { fontSize: 14, color: '#888' },

  apiKeyLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  apiInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  apiButtons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  apiSaveBtn: {
    backgroundColor: '#3B44AC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  apiSaveBtnDisabled: { backgroundColor: '#c0c0c0' },
  apiSaveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  apiClearText: { fontSize: 14, color: '#999', textDecorationLine: 'underline' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelOptionText: { fontSize: 15, color: '#333' },
  modelOptionTextActive: { color: '#3B44AC', fontWeight: '600' },
  modelCheckmark: { color: '#3B44AC', fontSize: 16, fontWeight: '600' },
  modalCancelBtn: { padding: 16, alignItems: 'center' },
  modalCancelText: { color: '#888', fontSize: 15 },
});
