import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BRANDS } from '../data/brands';

const BRANDS_KEY = 'aqua_brands';

interface Props {
  value: string;
  onChange: (brand: string) => void;
}

export default function BrandPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBrands();
  }, [modalVisible]);

  useEffect(() => {
    if (!modalVisible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSearch('');
      setModalVisible(false);
      return true;
    });
    return () => subscription.remove();
  }, [modalVisible]);

  const loadBrands = async () => {
    const data = await AsyncStorage.getItem(BRANDS_KEY);
    if (data) {
      setAllBrands(JSON.parse(data));
    } else {
      setAllBrands(BRANDS);
    }
  };

  const filteredBrands = search.trim().length > 0
    ? allBrands.filter(b => b.toLowerCase().includes(search.toLowerCase()))
    : allBrands;

  const handleSelect = (brand: string) => {
    onChange(brand);
    setSearch('');
    setModalVisible(false);
  };

  const handleClose = () => {
    setSearch('');
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={value ? styles.selectorText : styles.selectorPlaceholder}>
          {value || t('color.brand')}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('color.brand')}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder={t('brand.search')}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          <FlatList
            data={filteredBrands}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, value === item && styles.optionActive]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.optionText, value === item && styles.optionTextActive]}>
                  {item}
                </Text>
                {value === item && <Text>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#fafafa', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorText: { fontSize: 15, color: '#000' },
  selectorPlaceholder: { fontSize: 15, color: '#aaa' },
  arrow: { color: '#888', fontSize: 16 },
  modal: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeIcon: { fontSize: 18, color: '#888', padding: 4 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 8 },
  option: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' },
  optionActive: { backgroundColor: '#f0f2ff' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextActive: { color: '#3B44AC', fontWeight: '600' },
});