import { router, useFocusEffect } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FavoriteItem,
  FavoriteList,
  createFavoriteList,
  deleteFavoriteItem,
  deleteFavoriteList,
  getFavoriteItems,
  getFavoriteLists,
  renameFavoriteList,
} from '../storage/favorites';

const TYPE_BADGE: Record<string, string> = {
  mix: '🎨',
  technical: '⭐',
  compatible: '🎯',
  found: '✅',
  detected: '🔍',
};

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, FavoriteItem[]>>({});

  // List renaming (inline)
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // New list modal
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const load = useCallback(async () => {
    const [fetchedLists, fetchedItems] = await Promise.all([
      getFavoriteLists(),
      getFavoriteItems(),
    ]);
    setLists(fetchedLists);
    const grouped: Record<string, FavoriteItem[]> = {};
    for (const list of fetchedLists) {
      grouped[list.id] = fetchedItems
        .filter(i => i.listId === list.id)
        .sort((a, b) => a.savedAt - b.savedAt);
    }
    setItemsByList(grouped);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ─── Delete item ─────────────────────────────────────────────────────────────

  const handleDeleteItem = (item: FavoriteItem) => {
    Alert.alert(t('common.confirm'), t('favorites.confirm_delete_item'), [
      { text: t('color.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteFavoriteItem(item.id);
          setItemsByList(prev => ({
            ...prev,
            [item.listId]: prev[item.listId]?.filter(i => i.id !== item.id) ?? [],
          }));
        },
      },
    ]);
  };

  // ─── Delete list ─────────────────────────────────────────────────────────────

  const handleDeleteList = (list: FavoriteList) => {
    Alert.alert(t('common.confirm'), t('favorites.confirm_delete_list'), [
      { text: t('color.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteFavoriteList(list.id);
          setLists(prev => prev.filter(l => l.id !== list.id));
          setItemsByList(prev => {
            const updated = { ...prev };
            delete updated[list.id];
            return updated;
          });
        },
      },
    ]);
  };

  // ─── Rename list ─────────────────────────────────────────────────────────────

  const startRename = (list: FavoriteList) => {
    setRenamingListId(list.id);
    setRenameText(list.name);
  };

  const commitRename = async (listId: string) => {
    const name = renameText.trim();
    if (!name) {
      setRenamingListId(null);
      return;
    }
    await renameFavoriteList(listId, name);
    setLists(prev => prev.map(l => (l.id === listId ? { ...l, name } : l)));
    setRenamingListId(null);
  };

  // ─── Create new list ─────────────────────────────────────────────────────────

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      Alert.alert(t('common.error'), t('favorites.list_name_required'));
      return;
    }
    const newList = await createFavoriteList(name);
    setLists(prev => [...prev, newList]);
    setItemsByList(prev => ({ ...prev, [newList.id]: [] }));
    setNewListName('');
    setShowNewListModal(false);
  };

  // ─── Add to inventory ────────────────────────────────────────────────────────

  const handleAddToInventory = (item: FavoriteItem) => {
    router.push({
      pathname: '/add-color',
      params: {
        name: item.name,
        brand: item.brand ?? '',
        hex: item.hex,
      },
    } as any);
  };

  // ─── Type label ──────────────────────────────────────────────────────────────

  const typeLabel = (type: string) => {
    switch (type) {
      case 'mix': return t('favorites.type_mix');
      case 'technical': return t('favorites.type_technical');
      case 'compatible': return t('favorites.type_compatible');
      case 'found': return t('favorites.type_found');
      case 'detected': return t('favorites.type_detected');
      default: return type;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
          <TouchableOpacity style={styles.newListBtn} onPress={() => setShowNewListModal(true)}>
            <Text style={styles.newListBtnText}>{t('favorites.new_list')}</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {lists.length === 0 && (
          <Text style={styles.emptyText}>{t('favorites.empty_lists')}</Text>
        )}

        {/* Lists */}
        {lists.map(list => (
          <View key={list.id} style={styles.listSection}>

            {/* List header */}
            <View style={styles.listHeader}>
              {renamingListId === list.id ? (
                <TextInput
                  style={styles.renameInput}
                  value={renameText}
                  onChangeText={setRenameText}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => commitRename(list.id)}
                  onBlur={() => commitRename(list.id)}
                />
              ) : (
                <TouchableOpacity style={{ flex: 1 }} onLongPress={() => startRename(list)}>
                  <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
                </TouchableOpacity>
              )}
              <View style={styles.listActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => startRename(list)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.renameText}>{t('favorites.rename_list')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDeleteList(list)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Trash2 size={15} color="#cc3333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Items */}
            {(itemsByList[list.id] ?? []).length === 0 ? (
              <Text style={styles.emptyItems}>{t('favorites.empty_items')}</Text>
            ) : (
              (itemsByList[list.id] ?? []).map(item => (
                <View key={item.id} style={styles.itemRow}>
                  {/* Swatch */}
                  <View style={[styles.swatch, { backgroundColor: item.hex }]} />

                  {/* Info */}
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.typeBadge}>{TYPE_BADGE[item.type] ?? '★'}</Text>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      {item.brand ? `${item.brand} · ` : ''}{typeLabel(item.type)}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.addInventoryBtn}
                      onPress={() => handleAddToInventory(item)}
                    >
                      <Text style={styles.addInventoryText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteItem(item)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Trash2 size={15} color="#cc3333" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ))}

      </ScrollView>

      {/* New list modal */}
      <Modal
        visible={showNewListModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewListModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewListModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('favorites.new_list')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder={t('favorites.new_list_placeholder')}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateList}
            />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateList}>
              <Text style={styles.modalSaveBtnText}>{t('favorites.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => { setShowNewListModal(false); setNewListName(''); }}
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  newListBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3B44AC',
  },
  newListBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },

  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    marginTop: 48,
  },

  listSection: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  renameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    borderWidth: 1,
    borderColor: '#3B44AC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f1ff',
  },
  listActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  renameText: { fontSize: 12, color: '#888' },
  iconBtn: { padding: 2 },

  emptyItems: {
    fontSize: 13,
    color: '#bbb',
    padding: 14,
    fontStyle: 'italic',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  swatch: {
    width: 10,
    height: 44,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeBadge: { fontSize: 14 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1 },
  itemMeta: { fontSize: 12, color: '#888' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addInventoryBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3B44AC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInventoryText: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22 },

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
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#3B44AC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalCancelBtn: { padding: 16, alignItems: 'center' },
  modalCancelText: { color: '#888', fontSize: 15 },
});
