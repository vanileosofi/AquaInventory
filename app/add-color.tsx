import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandPicker from '../components/BrandPicker';
import ColorAISearch from '../components/ColorAISearch';
import HexColorPicker from '../components/ColorPicker';
import { saveColor } from '../storage/colors';
import { showError } from '../utils/alert';

const FORMATS = ['pan', 'tube'];
const QUANTITIES = ['full', 'half', 'low', 'empty'];

const LIGHTFAST_EMOJIS: Record<number, string> = {
  1: '☀️',
  2: '☀️☀️',
  3: '☀️☀️☀️',
};

const TRANSPARENCY_OPTIONS = [
  { value: 'transparent', emoji: '⬜' },
  { value: 'opaque', emoji: '⬛' },
  { value: 'semi_opaque', emoji: '◧' },
  { value: 'semi_transparent', emoji: '◨' },
  { value: 'granulating', emoji: '〣' },
];

const QTY_EMOJI: Record<string, string> = {
  full: '🟢',
  half: '🟡',
  low: '🟠',
  empty: '🔴',
};

export default function AddColorScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const scrollRef = useRef<any>(null);
  const params = useLocalSearchParams<{ name?: string; brand?: string; hex?: string }>();

  useEffect(() => {
    navigation.setOptions({ title: t('inventory.add_color_title') });
  }, [navigation, t]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState('pan');
  const [lightfast, setLightfast] = useState(0);
  const [transparency, setTransparency] = useState('');
  const [series, setSeries] = useState('');
  const [inUse, setInUse] = useState(false);
  const [quantity, setQuantity] = useState('full');
  const [spare, setSpare] = useState(0);
  const [notes, setNotes] = useState('');
  const [hex, setHex] = useState('#000000');

  useFocusEffect(
    useCallback(() => {
      setName(params.name ?? '');
      setBrand(params.brand ?? '');
      setCode('');
      setFormat('pan');
      setLightfast(0);
      setTransparency('');
      setSeries('');
      setInUse(false);
      setQuantity('full');
      setSpare(0);
      setNotes('');
      setHex(params.hex ?? '#000000');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [params.name, params.brand, params.hex])
  );

  const handleQuantitySelect = (q: string) => {
    setQuantity(q);
    if (q === 'empty') setInUse(false);
  };

  const handleInUseToggle = (value: boolean) => {
    setInUse(value);
    if (!value) setQuantity('empty');
  };

  const handleSave = async () => {
    if (!name.trim() || !brand.trim() || !code.trim()) {
      showError(t('common.required_fields'));
      return;
    }
    const result = await saveColor({
      name: name.trim(),
      brand: brand.trim(),
      code: code.trim(),
      series: series.trim(),
      format: format as 'pan' | 'tube',
      lightfast,
      transparency,
      inUse,
      quantity: quantity as 'full' | 'half' | 'low' | 'empty',
      spare,
      notes: notes.trim(),
      hex,
    });
    if (result.duplicate) {
      showError(t('color.duplicate'));
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>

        {/* Name */}
        <Text style={styles.label}>
          {t('color.name')}<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('color.name')}
        />

        {/* Brand */}
        <Text style={styles.label}>
          {t('color.brand')}<Text style={styles.required}> *</Text>
        </Text>
        <BrandPicker value={brand} onChange={setBrand} />

        {/* Code */}
        <Text style={styles.label}>
          {t('color.code')}<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder={t('color.code')}
        />

        {/* Format */}
        <Text style={styles.label}>
          {t('color.format')}<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.row}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, format === f && styles.chipActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.chipText, format === f && styles.chipTextActive]}>
                {t(`color.format_${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lightfastness */}
        <Text style={styles.label}>{t('color.lightfast')}</Text>
        <View style={styles.row}>
          {[1, 2, 3].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, lightfast === level && styles.chipActive]}
              onPress={() => setLightfast(lightfast === level ? 0 : level)}
            >
              <Text style={styles.chipEmoji}>{LIGHTFAST_EMOJIS[level]}</Text>
              <Text style={[styles.chipText, lightfast === level && styles.chipTextActive]}>
                {t(`color.lightfast_${level}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transparency */}
        <Text style={styles.label}>{t('color.transparency')}</Text>
        <View style={styles.row}>
          {TRANSPARENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, transparency === opt.value && styles.chipActive]}
              onPress={() => setTransparency(transparency === opt.value ? '' : opt.value)}
            >
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.chipText, transparency === opt.value && styles.chipTextActive]}>
                {t(`color.transparency_${opt.value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Series */}
        <Text style={styles.label}>{t('color.series')}</Text>
        <TextInput
          style={styles.input}
          value={series}
          onChangeText={setSeries}
          placeholder={t('color.series')}
        />

        {/* In use */}
        <Text style={styles.label}>{t('color.in_use')}</Text>
        <View style={styles.row}>
          {[true, false].map((val) => (
            <TouchableOpacity
              key={String(val)}
              style={[styles.chip, inUse === val && styles.chipActive]}
              onPress={() => handleInUseToggle(val)}
            >
              <Text style={[styles.chipText, inUse === val && styles.chipTextActive]}>
                {val ? '✅ ' + t('common.yes') : '❌ ' + t('common.no')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity — only if in use */}
        {inUse && (
          <>
            <Text style={styles.label}>{t('color.quantity')}</Text>
            <View style={styles.row}>
              {QUANTITIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, quantity === q && styles.chipActive]}
                  onPress={() => handleQuantitySelect(q)}
                >
                  <Text style={styles.chipEmoji}>{QTY_EMOJI[q]}</Text>
                  <Text style={[styles.chipText, quantity === q && styles.chipTextActive]}>
                    {t(`quantity.${q}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Spare */}
        <Text style={styles.label}>{t('color.spare')}</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setSpare(Math.max(0, spare - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{spare}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setSpare(spare + 1)}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <Text style={styles.label}>{t('color.notes')}</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('color.notes')}
          multiline
          numberOfLines={3}
        />

        {/* HEX */}
        <Text style={styles.label}>{t('color.hex')}</Text>
        <View style={styles.hexRow}>
          <View style={[styles.hexSwatch, { backgroundColor: hex }]} />
          <Text style={styles.hexValue}>{hex}</Text>
          <Text style={styles.searchLabel}>{t('color_ai.search_label')}</Text>
          <ColorAISearch
            name={name}
            brand={brand}
            code={code}
            onSelect={setHex}
            buttonLabel={t('color_ai.ai_button')}
          />
          <HexColorPicker
            value={hex}
            onChange={setHex}
            buttonLabel={t('color_ai.manual_button')}
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('color.save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (params.name || params.brand || params.hex) {
              router.navigate('/favorites' as any);
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.cancelButtonText}>{t('color.cancel')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  required: { color: 'red', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5', marginBottom: 4 },
  chipActive: { backgroundColor: '#3B44AC', borderColor: '#3B44AC' },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B44AC', alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  stepperValue: { fontSize: 20, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  hexSwatch: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  hexValue: { fontSize: 14, color: '#333', flex: 1 },
  searchLabel: { fontSize: 13, color: '#666' },
  saveButton: { backgroundColor: '#3B44AC', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#888', fontSize: 15 },
});