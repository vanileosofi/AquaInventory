import { router, useFocusEffect } from 'expo-router';
import { ArrowUpDown, ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FAB from '../components/FAB';
import QuantityBadge from '../components/QuantityBadge';
import { Color, getColors } from '../storage/colors';

export default function InventoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [colors, setColors] = useState<Color[]>([]);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pan' | 'tube'>('all');
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [quantityFilter, setQuantityFilter] = useState<'all' | 'full' | 'half' | 'low' | 'empty'>('all');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'brand' | 'format' | 'quantity'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);

  const loadColors = async () => {
    const data = await getColors();
    setColors(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadColors();
    }, [])
  );

  const brands = Array.from(new Set(colors.map(c => c.brand).filter(Boolean))).sort();

  const hasFilters = formatFilter !== 'all' || brandFilters.length > 0 || quantityFilter !== 'all' || search.trim() !== '';

  const clearFilters = () => {
    setFormatFilter('all');
    setBrandFilters([]);
    setQuantityFilter('all');
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
    const matchQuantity = quantityFilter === 'all' || c.quantity === quantityFilter;
    const formatTranslated = t(`color.format_${c.format}`).toLowerCase();
    const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const searchFields = [c.name, c.brand, c.code, c.series, c.hex, c.notes, formatTranslated]
      .map(f => f?.toLowerCase() || '').join(' ');
    const matchSearch = searchWords.length === 0 || searchWords.every(word => searchFields.includes(word));
    return matchFormat && matchBrand && matchQuantity && matchSearch;
  });

  const formatLabel = formatFilter === 'all' ? t('inventory.filter_format') :
    formatFilter === 'pan' ? t('inventory.filter_pan') : t('inventory.filter_tube');

  const brandLabel = brandFilters.length === 0 ? t('inventory.filter_brand') :
    brandFilters.length === 1
      ? (brandFilters[0].length > 6 ? brandFilters[0].slice(0, 6) + '…' : brandFilters[0])
      : `${brandFilters.length} ${t('inventory.filter_brands_selected')}`;

  const quantityLabel = quantityFilter === 'all' ? t('inventory.filter_quantity') : t(`quantity.${quantityFilter}`);

  const quantityOrder: Record<string, number> = { full: 0, half: 1, low: 2, empty: 3 };

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc'
        ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        : b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
    }
    if (sortKey === 'brand') {
      return sortDir === 'asc'
        ? a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' })
        : b.brand.localeCompare(a.brand, undefined, { sensitivity: 'base' });
    }
    let valA: string | number = '';
    let valB: string | number = '';
    if (sortKey === 'format') { valA = a.format; valB = b.format; }
    if (sortKey === 'quantity') { valA = quantityOrder[a.quantity]; valB = quantityOrder[b.quantity]; }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>

      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('inventory.title')}</Text>
        <Text style={styles.colorCount}>Total: {colors.length}</Text>
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

      {/* Results count + clear */}
      {hasFilters && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearButtonText}>{t('inventory.clear_filters')}</Text>
          </TouchableOpacity>
          <Text style={styles.resultsCount}>{filtered.length} / {colors.length}</Text>
        </View>
      )}

      {/* Filter buttons */}
      <View style={styles.filtersRow}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        <TouchableOpacity
          style={[styles.filterButton, formatFilter !== 'all' && styles.filterButtonActive]}
          onPress={() => {
            if (formatFilter !== 'all') {
              setFormatFilter('all');
            } else {
              setShowFormatModal(true);
            }
          }}
        >
          <Text style={[styles.filterButtonText, formatFilter !== 'all' && styles.filterButtonTextActive]}>
            {formatFilter !== 'all' ? `${formatLabel} ×` : formatLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, brandFilters.length > 0 && styles.filterButtonActive]}
          onPress={() => {
            if (brandFilters.length > 0) {
              setBrandFilters([]);
            } else {
              setShowBrandModal(true);
            }
          }}
        >
          <Text style={[styles.filterButtonText, brandFilters.length > 0 && styles.filterButtonTextActive]}>
            {brandFilters.length > 0 ? `${brandLabel} ×` : brandLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, quantityFilter !== 'all' && styles.filterButtonActive]}
          onPress={() => {
            if (quantityFilter !== 'all') {
              setQuantityFilter('all');
            } else {
              setShowQuantityModal(true);
            }
          }}
        >
          <Text style={[styles.filterButtonText, quantityFilter !== 'all' && styles.filterButtonTextActive]}>
            {quantityFilter !== 'all' ? `${quantityLabel} ×` : quantityLabel}
          </Text>
        </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, styles.filterButtonActive, { alignSelf: 'flex-start' }]}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <Text style={styles.empty}>{t('inventory.empty')}</Text>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          contentContainerStyle={{ paddingBottom: 50 + insets.bottom }}
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
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <Text style={styles.modalTitle}>{t('inventory.filter_format')}</Text>
            {(['pan', 'tube'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={styles.modalOption}
                onPress={() => { setFormatFilter(f); setShowFormatModal(false); }}
              >
                <Text style={[styles.modalOptionText, formatFilter === f && styles.modalOptionTextActive]}>
                  {f === 'pan' ? t('inventory.filter_pan') : t('inventory.filter_tube')}
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
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <Text style={styles.modalTitle}>{t('inventory.filter_brand')}</Text>
            <ScrollView>
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} animationType="slide" transparent onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <Text style={styles.modalTitle}>{t('inventory.sort_by')}</Text>
            {([
              { key: 'name', dir: 'asc', label: t('inventory.sort_name_asc') },
              { key: 'name', dir: 'desc', label: t('inventory.sort_name_desc') },
              { key: 'brand', dir: 'asc', label: t('inventory.sort_brand_asc') },
              { key: 'brand', dir: 'desc', label: t('inventory.sort_brand_desc') },
              { key: 'format', dir: 'asc', label: t('inventory.sort_format_asc') },
              { key: 'format', dir: 'desc', label: t('inventory.sort_format_desc') },
              { key: 'quantity', dir: 'asc', label: t('inventory.sort_quantity_asc') },
              { key: 'quantity', dir: 'desc', label: t('inventory.sort_quantity_desc') },
            ] as const).map(option => (
              <TouchableOpacity
                key={`${option.key}-${option.dir}`}
                style={styles.modalOption}
                onPress={() => { setSortKey(option.key); setSortDir(option.dir); setShowSortModal(false); }}
              >
                <Text style={[styles.modalOptionText, sortKey === option.key && sortDir === option.dir && styles.modalOptionTextActive]}>
                  {option.label}
                </Text>
                {sortKey === option.key && sortDir === option.dir && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quantity Modal */}
      <Modal visible={showQuantityModal} animationType="slide" transparent onRequestClose={() => setShowQuantityModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowQuantityModal(false)}>
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <Text style={styles.modalTitle}>{t('inventory.filter_quantity')}</Text>
            {(['full', 'half', 'low', 'empty'] as const).map(q => (
              <TouchableOpacity
                key={q}
                style={styles.modalOption}
                onPress={() => { setQuantityFilter(q); setShowQuantityModal(false); }}
              >
                <Text style={[styles.modalOptionText, quantityFilter === q && styles.modalOptionTextActive]}>
                  {t(`quantity.${q}`)}
                </Text>
                {quantityFilter === q && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
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
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 10, justifyContent: 'space-between' },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  filterButtonActive: { backgroundColor: '#3B44AC', borderColor: '#3B44AC' },
  filterButtonText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterButtonTextActive: { color: '#fff', fontWeight: '600' },
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

});