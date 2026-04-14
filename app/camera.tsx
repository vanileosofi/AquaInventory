import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ImageIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResultCard from '../components/camera/ResultCard';
import { CameraAnalysis, analyzeColorImage } from '../services/geminiVision';
import { getApiKey } from '../storage/apikey';

export default function CameraScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CameraAnalysis | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert(
        t('camera.no_api_key_title'),
        t('camera.no_api_key_desc'),
        [
          { text: t('common.no'), style: 'cancel' },
          { text: t('camera.go_to_settings'), onPress: () => router.push('/settings') },
        ]
      );
      return false;
    }
    return true;
  };

  const runAnalysis = useCallback(async (base64: string, mime: string, uri: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCroppedUri(uri);
    try {
      const result = await analyzeColorImage(base64, mime, i18n.language);
      setAnalysis(result);
    } catch (e: any) {
      if (e.message === 'NO_API_KEY') setError(t('camera.no_api_key_desc'));
      else if (e.message === 'INVALID_API_KEY') setError(t('camera.invalid_api_key'));
      else setError(e.message || t('camera.analysis_error'));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t]);

  const pickFromCamera = useCallback(async () => {
    if (!(await checkApiKey())) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('camera.permission_denied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await runAnalysis(result.assets[0].base64, result.assets[0].mimeType ?? 'image/jpeg', result.assets[0].uri);
    }
  }, [t, runAnalysis]);

  const pickFromGallery = useCallback(async () => {
    if (!(await checkApiKey())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await runAnalysis(result.assets[0].base64, result.assets[0].mimeType ?? 'image/jpeg', result.assets[0].uri);
    }
  }, [runAnalysis]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setCroppedUri(null);
    setError(null);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.subtitle}>{t('camera.subtitle')}</Text>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#3B44AC" size="large" />
            <Text style={styles.loadingText}>{t('camera.analyzing')}</Text>
          </View>
        )}

        {/* Botones pick */}
        {!loading && !analysis && (
          <View style={styles.pickZone}>
            <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera}>
              <Camera size={26} color="#3B44AC" />
              <Text style={styles.pickBtnLabel}>{t('camera.take_photo')}</Text>
            </TouchableOpacity>
            <View style={styles.pickDivider} />
            <TouchableOpacity style={styles.pickBtn} onPress={pickFromGallery}>
              <ImageIcon size={26} color="#3B44AC" />
              <Text style={styles.pickBtnLabel}>{t('camera.choose_gallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text style={styles.errorLink}>{t('camera.go_to_settings')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado */}
        {analysis && (
          <ResultCard analysis={analysis} croppedUri={croppedUri} onReset={reset} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 14 },
  subtitle: { fontSize: 14, color: '#888', lineHeight: 20 },
  pickZone: {
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
    marginTop: 4,
  },
  pickBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  pickBtnLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  pickDivider: { width: 1, backgroundColor: '#ddd', marginVertical: 20 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 14, color: '#888' },
  errorBox: { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#ffcccc', borderRadius: 10, padding: 14, gap: 8 },
  errorText: { fontSize: 13, color: '#cc0000', lineHeight: 19 },
  errorLink: { fontSize: 13, color: '#3B44AC', textDecorationLine: 'underline', fontWeight: '500' },
});