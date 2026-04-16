import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ImageIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResultCard from '../components/camera/ResultCard';
import { AppError, canRetry, getErrorTranslationKey, hasRetryCountdown, isApiKeyError } from '../services/errorHandler';
import { CameraAnalysis, analyzeColorImage } from '../services/geminiVision';
import { getApiKey } from '../storage/apikey';

interface CapturedImage {
  base64: string;
  mime: string;
  uri: string;
}

const RETRY_DELAY = 5;

export default function CameraScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string; ts?: string }>();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CameraAnalysis | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [lastImage, setLastImage] = useState<CapturedImage | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Start countdown when a rate-limited or overloaded error appears
  useEffect(() => {
    if (!error) return;
    if (hasRetryCountdown(error)) {
      setRetryCountdown(error.retryAfterSeconds ?? RETRY_DELAY);
    } else {
      setRetryCountdown(0);
    }
  }, [error]);

  // Countdown ticker
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const id = setTimeout(() => setRetryCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [retryCountdown]);

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

  const runAnalysis = useCallback(async (captured: CapturedImage) => {
    setLastImage(captured);
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCroppedUri(captured.uri);
    try {
      const result = await analyzeColorImage(captured.base64, captured.mime, i18n.language);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.code ? (e as AppError) : { code: 'GENERIC_ERROR' });
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
      await runAnalysis({
        base64: result.assets[0].base64,
        mime: result.assets[0].mimeType ?? 'image/jpeg',
        uri: result.assets[0].uri,
      });
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
      await runAnalysis({
        base64: result.assets[0].base64,
        mime: result.assets[0].mimeType ?? 'image/jpeg',
        uri: result.assets[0].uri,
      });
    }
  }, [runAnalysis]);

  // Auto-trigger picker when navigating from FAB (ts changes on every FAB press)
  useEffect(() => {
    if (!params.source || !params.ts) return;
    if (params.source === 'camera') pickFromCamera();
    else if (params.source === 'gallery') pickFromGallery();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.ts]);

  const handleRetry = useCallback(() => {
    if (!lastImage) return;
    if (error && hasRetryCountdown(error) && retryCountdown > 0) return;
    runAnalysis(lastImage);
  }, [lastImage, error, retryCountdown, runAnalysis]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setCroppedUri(null);
    setError(null);
    setLastImage(null);
    setRetryCountdown(0);
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

        {/* Pick buttons + hints — only when idle */}
        {!loading && !analysis && !error && (
          <>
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
            <View style={styles.hintsBox}>
              <Text style={styles.hintsRow}>📷  {t('camera.hint_subjects')}</Text>
              <Text style={styles.hintsRow}>💡  {t('camera.hint_light')}</Text>
            </View>
          </>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorBox}>
            {croppedUri && (
              <Image
                source={{ uri: croppedUri }}
                style={styles.errorImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.errorText}>
              {t(getErrorTranslationKey(error), { seconds: retryCountdown })}
            </Text>
            {canRetry(error) && (
              <TouchableOpacity
                style={[styles.retryBtn, (hasRetryCountdown(error) && retryCountdown > 0) && styles.retryBtnDisabled]}
                onPress={handleRetry}
                disabled={hasRetryCountdown(error) && retryCountdown > 0}
              >
                <Text style={styles.retryBtnText}>
                  {hasRetryCountdown(error) && retryCountdown > 0
                    ? `${t('camera.retry')} (${retryCountdown}s)`
                    : t('camera.retry')}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.errorLinks}>
              <TouchableOpacity onPress={reset}>
                <Text style={styles.errorLink}>{t('camera.change_image')}</Text>
              </TouchableOpacity>
              {isApiKeyError(error) && (
                <>
                  <Text style={styles.errorLinkDivider}>·</Text>
                  <TouchableOpacity onPress={() => router.push('/settings')}>
                    <Text style={styles.errorLink}>{t('camera.go_to_settings')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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

  errorBox: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  errorImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorText: { fontSize: 13, color: '#cc0000', lineHeight: 19, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#3B44AC',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  retryBtnDisabled: { backgroundColor: '#aaaacc' },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hintsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  hintsRow: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  errorLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorLink: { fontSize: 13, color: '#3B44AC', textDecorationLine: 'underline', fontWeight: '500' },
  errorLinkDivider: { fontSize: 13, color: '#ccc' },
});
