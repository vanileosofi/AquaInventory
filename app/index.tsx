import { router, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FAB from '../components/FAB';
import QuantityBadge from '../components/QuantityBadge';
import { Color, getColors } from '../storage/colors';

export default function InventoryScreen() {
  const { t } = useTranslation();
  const [colors, setColors] = useState<Color[]>([]);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pan' | 'tube'>('all');
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const loadColors = async () => {
    const data = await getColors();
    setColors(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useFocusEffect(
    useCallback(() => {
      loadColors();
    }, [])
  );

  const brands = Array.from(new Set(colors.map(c => c.brand).filter(Boolean))).sort();

  const hasFilters = formatFilter !== 'all' || brandFilters.length > 0 || search.trim() !== '';

  const clearFilters = () => {
    setFormatFilter('all');
    setBrandFilters([]);
    setSearch('');
    Keyboard.dismiss();
  };

  const toggleBrand = (brand: string) => {
    setBrandFilters(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const filtered = colors.filter(c => {
    const matchFormat = formatFilter === 'all' || c.format === formatFilter;
    const matchBrand = brandFilters.length === 0 || brandFilters.includes(c.brand);
    const formatTranslated = t(`color.format_${c.format}`).toLowerCase();
    const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const searchFields = [c.name, c.brand, c.code, c.series, c.hex, c.notes, formatTranslated]
      .map(f => f?.toLowerCase() || '').join(' ');
    const matchSearch = searchWords.length === 0 || searchWords.every(word => searchFields.includes(word));
    return matchFormat && matchBrand && matchSearch;
  });

  const formatLabel = formatFilter === 'all' ? t('inventory.filter_format') :
    formatFilter === 'pan' ? t('inventory.filter_pan') : t('inventory.filter_tube');

  const brandLabel = brandFilters.length === 0 ? t('inventory.filter_brand') :
    brandFilters.length === 1 ? brandFilters[0] : `${brandFilters.length} ${t('inventory.filter_brands_selected')}`;

  return (
    <SafeAreaView style={styles.container}>

      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('inventory.title')}</Text>
        <Text style={styles.colorCount}>Total: {colors.length}</Text>
      </View>

      {/* Filter buttons */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterButton, formatFilter !== 'all' && styles.filterButtonActive]}
          onPress={() => setShowFormatModal(true)}
        >
          <Text style={[styles.filterButtonText, formatFilter !== 'all' && styles.filterButtonTextActive]}>
            {formatLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, brandFilters.length > 0 && styles.filterButtonActive]}
          onPress={() => setShowBrandModal(true)}
        >
          <Text style={[styles.filterButtonText, brandFilters.length > 0 && styles.filterButtonTextActive]}>
            {brandLabel}
          </Text>
        </TouchableOpacity>

        {hasFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>{t('inventory.clear_filters')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder={t('inventory.search_placeholder')}
        clearButtonMode="while-editing"
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      {/* Results count */}
      {hasFilters && (
        <Text style={styles.resultsCount}>{filtered.length} / {colors.length}</Text>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Text style={styles.empty}>{t('inventory.empty')}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          contentContainerStyle={{ paddingBottom: 90 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/color-detail?id=${item.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.swatch, { backgroundColor: item.hex }]} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.brand}>
                  {item.brand} · {t(`color.format_${item.format}`)}
                </Text>
              </View>
              <View style={styles.badgeWrap}>
                <QuantityBadge quantity={item.quantity as any} inUse={item.inUse} />
              </View>
              <View style={styles.chevron}>
                <ChevronRight size={22} color="#ccc" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <FAB />

      {/* Format Modal */}
      <Modal visible={showFormatModal} animationType="slide" transparent onRequestClose={() => setShowFormatModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFormatModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('inventory.filter_format')}</Text>
            {(['all', 'pan', 'tube'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={styles.modalOption}
                onPress={() => { setFormatFilter(f); setShowFormatModal(false); }}
              >
                <Text style={[styles.modalOptionText, formatFilter === f && styles.modalOptionTextActive]}>
                  {f === 'all' ? t('inventory.filter_all') : f === 'pan' ? t('inventory.filter_pan') : t('inventory.filter_tube')}
                </Text>
                {formatFilter === f && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Brand Modal */}
      <Modal visible={showBrandModal} animationType="slide" transparent onRequestClose={() => setShowBrandModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowBrandModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('inventory.filter_brand')}</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => setBrandFilters([])}
              >
                <Text style={[styles.modalOptionText, brandFilters.length === 0 && styles.modalOptionTextActive]}>
                  {t('inventory.filter_all')}
                </Text>
                {brandFilters.length === 0 && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              {brands.map(b => (
                <TouchableOpacity
                  key={b}
                  style={styles.modalOption}
                  onPress={() => toggleBrand(b)}
                >
                  <Text style={[styles.modalOptionText, brandFilters.includes(b) && styles.modalOptionTextActive]}>
                    {b}
                  </Text>
                  {brandFilters.includes(b) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBrandModal(false)}>
              <Text style={styles.modalCloseButtonText}>{t('color.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 24, fontWeight: 'bold', lineHeight: 28 },
  colorCount: { fontSize: 18, fontWeight: '600', color: '#000000' },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  filterButtonActive: { backgroundColor: '#3B44AC', borderColor: '#3B44AC' },
  filterButtonText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterButtonTextActive: { color: '#fff', fontWeight: '600' },
  clearButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ff4444', backgroundColor: '#fff' },
  clearButtonText: { fontSize: 13, color: '#ff4444', fontWeight: '500' },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 6 },
  resultsCount: { fontSize: 12, color: '#999', marginBottom: 6 },
  empty: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: '#999', fontSize: 16, marginTop: 60 },
  card: { flexDirection: 'row', alignItems: 'stretch', paddingVertical: 12, paddingLeft: 12, paddingRight: 0, marginBottom: 10, borderRadius: 12, backgroundColor: '#f5f5f5' },
  chevron: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  swatch: { width: 20, height: 48, borderRadius: 4, marginRight: 12, alignSelf: 'center' },
  info: { flex: 1, justifyContent: 'center' },
  badgeWrap: { alignSelf: 'center', marginLeft: 8, marginRight: 0 },
  name: { fontSize: 16, fontWeight: '600' },
  brand: { fontSize: 13, color: '#666', marginTop: 2 },
  qty: { fontSize: 22, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionText: { fontSize: 15, color: '#333' },
  modalOptionTextActive: { color: '#3B44AC', fontWeight: '600' },
  checkmark: { color: '#3B44AC', fontSize: 16, fontWeight: '600' },
  modalCloseButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  modalCloseButtonText: { color: '#888', fontSize: 15 },
});