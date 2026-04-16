import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRANDS } from '../data/brands';
import { showConfirm, showError } from '../utils/alert';

const BRANDS_KEY = 'aqua_brands';

const toTitleCase = (str: string) =>
  str.trim().replace(/\b\w/g, c => c.toUpperCase());

export default function BrandsScreen() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const data = await AsyncStorage.getItem(BRANDS_KEY);
    if (data) {
      setBrands(JSON.parse(data));
    } else {
      setBrands(BRANDS);
      await AsyncStorage.setItem(BRANDS_KEY, JSON.stringify(BRANDS));
    }
  };

  const saveBrands = async (updated: string[]) => {
    await AsyncStorage.setItem(BRANDS_KEY, JSON.stringify(updated));
    setBrands(updated);
  };

  const filteredBrands = newBrand.trim().length > 0
    ? brands.filter(b => b.toLowerCase().includes(newBrand.toLowerCase()))
    : brands;

  const handleAdd = async () => {
    const trimmed = toTitleCase(newBrand);
    if (!trimmed) return;
    const exists = brands.some(b => b.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showError(t('brand.already_exists'));
      return;
    }
    await saveBrands([...brands, trimmed]);
    setNewBrand('');
  };

  const handleDelete = (index: number) => {
    const realIndex = brands.indexOf(filteredBrands[index]);
    showConfirm(
      t('brand.confirm_delete'),
      async () => {
        await saveBrands(brands.filter((_, i) => i !== realIndex));
      },
      t('color.cancel'),
      t('common.yes')
    );
  };

  const handleEditStart = (index: number) => {
    const realIndex = brands.indexOf(filteredBrands[index]);
    setEditingIndex(realIndex);
    setEditingValue(filteredBrands[index]);
  };

  const handleEditSave = async () => {
    if (!editingValue.trim() || editingIndex === null) return;
    const trimmed = toTitleCase(editingValue);
    const exists = brands.some((b, i) => b.toLowerCase() === trimmed.toLowerCase() && i !== editingIndex);
    if (exists) {
      showError(t('brand.already_exists'));
      return;
    }
    const updated = [...brands];
    updated[editingIndex] = trimmed;
    await saveBrands(updated);
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Add / Search */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newBrand}
          onChangeText={setNewBrand}
          placeholder={t('brand.search')}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Results count when searching */}
      {newBrand.trim().length > 0 && (
        <Text style={styles.resultsCount}>
          {filteredBrands.length} {t('brand.results')}
        </Text>
      )}

      <FlatList
        data={filteredBrands}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => {
          const realIndex = brands.indexOf(item);
          return (
            <View style={styles.row}>
              {editingIndex === realIndex ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.input, styles.editInput]}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.editSaveButton} onPress={handleEditSave}>
                    <Text style={styles.editSaveText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editCancelButton} onPress={handleEditCancel}>
                    <Text style={styles.editCancelText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.brandName}>{item}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEditStart(index)} style={styles.actionButton}>
                      <Pencil size={18} color="#3B44AC" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(index)} style={styles.actionButton}>
                      <Trash2 size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8, marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  addButton: { width: 48, height: 48, backgroundColor: '#3B44AC', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  resultsCount: { fontSize: 12, color: '#999', marginBottom: 8 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' },
  brandName: { fontSize: 15, color: '#333', flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  editInput: { flex: 1 },
  editSaveButton: { width: 36, height: 36, backgroundColor: '#3B44AC', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editSaveText: { color: '#fff', fontSize: 16 },
  editCancelButton: { width: 36, height: 36, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editCancelText: { color: '#888', fontSize: 16 },
});