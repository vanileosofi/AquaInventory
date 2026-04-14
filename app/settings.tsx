import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearApiKey, getApiKey, saveApiKey } from '../storage/apikey';
import { exportColors, importColors } from '../storage/colors';
import { showError } from '../utils/alert';


export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    getApiKey().then(setApiKey);
  }, []);
  
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert(t('common.error'), t('settings.api_key_empty'));
      return;
    }
    await saveApiKey(apiKey);
    Alert.alert('✅', t('settings.api_key_saved'));
  };
  
  const handleClearApiKey = async () => {
    await clearApiKey();
    setApiKey('');
    Alert.alert('✅', t('settings.api_key_cleared'));
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

  return (
    <SafeAreaView style={styles.container}>

      {/* Data */}
      <Text style={styles.section}>{t('settings.data')}</Text>
      <TouchableOpacity style={styles.row} onPress={handleExport}>
        <Text style={styles.rowText}>📤 {t('settings.export')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={handleImport}>
        <Text style={styles.rowText}>📥 {t('settings.import')}</Text>
      </TouchableOpacity>
      {/* IA */}
      <Text style={styles.section}>{t('settings.api')}</Text>
      <View style={styles.row}>
        <Text style={styles.rowText}>🤖 {t('settings.api_key')}</Text>
      </View>
      <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
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
          <TouchableOpacity style={styles.apiSaveBtn} onPress={handleSaveApiKey}>
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
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleLanguage('es')}
      >
        <Text style={styles.rowText}>🇪🇸 {t('settings.language_es')}</Text>
        {currentLang === 'es' && <Text style={styles.check}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleLanguage('en')}
      >
        <Text style={styles.rowText}>🇬🇧 {t('settings.language_en')}</Text>
        {currentLang === 'en' && <Text style={styles.check}>✓</Text>}
      </TouchableOpacity>

      {/* Dev */}
      <Text style={styles.section}>Dev</Text>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/dev-seed' as any)}>
        <Text style={styles.rowText}>🔧 {t('settings.dev_tools')}</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginTop: 24, marginBottom: 4, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  rowText: { fontSize: 16, color: '#333' },
  check: { color: '#3B44AC', fontSize: 16, fontWeight: '600' },
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
  apiSaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  apiClearText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
});