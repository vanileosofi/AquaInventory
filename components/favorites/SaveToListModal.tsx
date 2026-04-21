import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FavoriteItem,
  FavoriteList,
  createFavoriteList,
  deleteMatchingItemFromList,
  getListIdsContainingItem,
  getFavoriteLists,
  saveItemToLists,
} from '../../storage/favorites';

export type SavePayload = Omit<FavoriteItem, 'id' | 'listId' | 'savedAt' | 'notes'>;

interface Props {
  visible: boolean;
  item: SavePayload | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaveToListModal({ visible, item, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialSavedIds, setInitialSavedIds] = useState<string[]>([]);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setShowNewInput(false);
    setNewListName('');
    setUserHasInteracted(false);
    const data = await getFavoriteLists();
    setLists(data);
    const savedIds = item ? await getListIdsContainingItem(item) : [];
    setSelectedIds(savedIds);
    setInitialSavedIds(savedIds);
    setLoading(false);
  }, [item]);

  React.useEffect(() => {
    if (visible) loadLists();
  }, [visible, loadLists]);

  const toggleList = (id: string) => {
    setUserHasInteracted(true);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateAndSelect = async () => {
    const name = newListName.trim();
    if (!name) {
      Alert.alert(t('common.error'), t('favorites.list_name_required'));
      return;
    }
    const newList = await createFavoriteList(name);
    setLists(prev => [...prev, newList]);
    setSelectedIds(prev => [...prev, newList.id]);
    setUserHasInteracted(true);
    setNewListName('');
    setShowNewInput(false);
  };

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    const toAdd = selectedIds.filter(id => !initialSavedIds.includes(id));
    const toRemove = initialSavedIds.filter(id => !selectedIds.includes(id));
    if (toAdd.length > 0) await saveItemToLists(toAdd, item);
    for (const listId of toRemove) await deleteMatchingItemFromList(listId, item);
    setSaving(false);
    onSaved?.();
    onClose();
  };

  const TYPE_LABEL: Record<string, string> = {
    mix: t('favorites.type_mix'),
    technical: t('favorites.type_technical'),
    compatible: t('favorites.type_compatible'),
    found: t('favorites.type_found'),
    detected: t('favorites.type_detected'),
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('favorites.save_to_list')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Item preview */}
          {item && (
            <View style={styles.itemPreview}>
              <View style={[styles.previewSwatch, { backgroundColor: item.hex }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.previewMeta}>
                  {item.brand ? `${item.brand} · ` : ''}{TYPE_LABEL[item.type] ?? item.type}
                </Text>
              </View>
            </View>
          )}

          {/* List options */}
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#3B44AC" />
          ) : (
            <ScrollView style={styles.listScroll} contentContainerStyle={{ paddingBottom: 8 }}>
              {lists.map(list => {
                const isSelected = selectedIds.includes(list.id);
                return (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listRow}
                    onPress={() => toggleList(list.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.listName}>{list.name}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Create new list */}
              {showNewInput ? (
                <View style={styles.newListRow}>
                  <TextInput
                    style={styles.newListInput}
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholder={t('favorites.new_list_placeholder')}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCreateAndSelect}
                  />
                  <TouchableOpacity style={styles.newListConfirm} onPress={handleCreateAndSelect}>
                    <Text style={styles.newListConfirmText}>✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.createListBtn} onPress={() => setShowNewInput(true)}>
                  <Text style={styles.createListText}>{t('favorites.create_list')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, (!userHasInteracted || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!userHasInteracted || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {t('favorites.save')}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </Text>
            )}
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  closeBtn: {
    fontSize: 18,
    color: '#888',
    fontWeight: '300',
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 16,
  },
  previewSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  previewMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  listScroll: {
    marginBottom: 16,
    maxHeight: 220,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B44AC',
    borderColor: '#3B44AC',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  listName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  listNameDuplicate: {
    color: '#aaa',
  },
  checkboxDuplicate: {
    backgroundColor: '#e8e8e8',
    borderColor: '#ccc',
  },
  checkmarkDuplicate: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '700',
  },
  alreadySavedLabel: {
    fontSize: 11,
    color: '#aaa',
    fontStyle: 'italic',
  },
  newListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  newListInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  newListConfirm: {
    backgroundColor: '#3B44AC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newListConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  createListBtn: {
    paddingVertical: 14,
  },
  createListText: {
    fontSize: 14,
    color: '#3B44AC',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#3B44AC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
