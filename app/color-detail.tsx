import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandPicker from '../components/BrandPicker';
import ColorAISearch from '../components/ColorAISearch';
import HexColorPicker from '../components/ColorPicker';
import { Color, deleteColor, getColors, updateColor } from '../storage/colors';
import { showConfirm, showError } from '../utils/alert';

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

export default function ColorDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [color, setColor] = useState<Color | null>(null);
  const [editing, setEditing] = useState(false);

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

  const loadColor = async () => {
    const colors = await getColors();
    const found = colors.find(c => c.id === id);
    if (found) {
      setColor(found);
      setName(found.name);
      setBrand(found.brand);
      setCode(found.code);
      setFormat(found.format);
      setLightfast(found.lightfast);
      setTransparency(found.transparency);
      setSeries(found.series);
      setInUse(found.inUse);
      setQuantity(found.quantity);
      setSpare(found.spare);
      setNotes(found.notes);
      setHex(found.hex);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadColor();
      setEditing(false);
    }, [id])
  );

  const handleDelete = () => {
    showConfirm(
      t('color_detail.confirm_delete'),
      async () => {
        await deleteColor(id);
        router.back();
      },
      t('color.cancel'),
      t('common.yes')
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !brand.trim() || !code.trim()) {
      showError(t('common.required_fields'));
      return;
    }
    await updateColor(id, {
      name, brand, code, series,
      format: format as 'pan' | 'tube',
      lightfast, transparency, inUse,
      quantity: quantity as 'full' | 'half' | 'low' | 'empty',
      spare, notes, hex,
    });
    setEditing(false);
    loadColor();
  };

  const handleQuantitySelect = (q: string) => {
    setQuantity(q);
    if (q === 'empty') setInUse(false);
  };

  const handleInUseToggle = (value: boolean) => {
    setInUse(value);
    if (!value) setQuantity('empty');
  };

  if (!color) return null;

  const disabled = !editing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Action buttons */}
        <View style={styles.topActions}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('color.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setEditing(false); loadColor(); }}>
                <Text style={styles.cancelButtonText}>{t('color.cancel')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Pencil size={16} color="#3B44AC" />
                <Text style={styles.editButtonText}>{t('color_detail.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Trash2 size={16} color="#ff4444" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Name */}
        <Text style={styles.label}>
          {t('color.name')}<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={name}
          onChangeText={setName}
          editable={editing}
        />

        {/* Brand */}
        <Text style={styles.label}>
          {t('color.brand')}<Text style={styles.required}> *</Text>
        </Text>
        {editing ? (
          <BrandPicker value={brand} onChange={setBrand} />
        ) : (
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.disabledText}>{brand}</Text>
          </View>
        )}

        {/* Code */}
        <Text style={styles.label}>
          {t('color.code')}<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={code}
          onChangeText={setCode}
          editable={editing}
        />

        {/* Format */}
        <Text style={styles.label}>
          {t('color.format')}<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.row}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, format === f && styles.chipActive, disabled && styles.chipDisabled]}
              onPress={() => editing && setFormat(f)}
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
              style={[styles.chip, lightfast === level && styles.chipActive, disabled && styles.chipDisabled]}
              onPress={() => editing && setLightfast(lightfast === level ? 0 : level)}
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
              style={[styles.chip, transparency === opt.value && styles.chipActive, disabled && styles.chipDisabled]}
              onPress={() => editing && setTransparency(transparency === opt.value ? '' : opt.value)}
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
          style={[styles.input, disabled && styles.inputDisabled]}
          value={series}
          onChangeText={setSeries}
          editable={editing}
        />

        {/* In use */}
        <Text style={styles.label}>{t('color.in_use')}</Text>
        <View style={styles.row}>
          {[true, false].map((val) => (
            <TouchableOpacity
              key={String(val)}
              style={[styles.chip, inUse === val && styles.chipActive, disabled && styles.chipDisabled]}
              onPress={() => editing && handleInUseToggle(val)}
            >
              <Text style={[styles.chipText, inUse === val && styles.chipTextActive]}>
                {val ? '✅ ' + t('common.yes') : '❌ ' + t('common.no')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity */}
        {inUse && (
          <>
            <Text style={styles.label}>{t('color.quantity')}</Text>
            <View style={styles.row}>
              {QUANTITIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, quantity === q && styles.chipActive, disabled && styles.chipDisabled]}
                  onPress={() => editing && handleQuantitySelect(q)}
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
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => editing && setSpare(Math.max(0, spare - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{spare}</Text>
          <TouchableOpacity
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => editing && setSpare(spare + 1)}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <Text style={styles.label}>{t('color.notes')}</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline, disabled && styles.inputDisabled]}
          value={notes}
          onChangeText={setNotes}
          editable={editing}
          multiline
          numberOfLines={3}
        />

        {/* HEX */}
        <Text style={styles.label}>{t('color.hex')}</Text>
        {editing ? (
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
        ) : (
          <View style={styles.hexRow}>
            <View style={[styles.hexSwatch, { backgroundColor: hex }]} />
            <Text style={styles.hexValue}>{hex}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  topActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 8 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3B44AC' },
  editButtonText: { color: '#3B44AC', fontSize: 14, fontWeight: '600' },
  deleteButton: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ff4444' },
  saveButton: { flex: 1, backgroundColor: '#3B44AC', padding: 10, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelButton: { paddingHorizontal: 16, padding: 10 },
  cancelButtonText: { color: '#888', fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  required: { color: 'red', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#888' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  disabledText: { fontSize: 15, color: '#888' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5', marginBottom: 4 },
  chipActive: { backgroundColor: '#3B44AC', borderColor: '#3B44AC' },
  chipDisabled: { opacity: 0.6 },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B44AC', alignItems: 'center', justifyContent: 'center' },
  stepperButtonDisabled: { backgroundColor: '#ccc' },
  stepperButtonText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  stepperValue: { fontSize: 20, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  hexSwatch: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  hexValue: { fontSize: 14, color: '#333', flex: 1 },
  searchLabel: { fontSize: 13, color: '#666' },
});