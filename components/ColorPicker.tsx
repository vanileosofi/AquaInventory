import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export default function HexColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentColor, setCurrentColor] = useState(value);

  const handleConfirm = () => {
    onChange(currentColor);
    setModalVisible(false);
  };

  const handleClose = () => {
    setCurrentColor(value);
    setModalVisible(false);
  };

  return (
    <View>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.swatch, { backgroundColor: value }]}
          onPress={() => setModalVisible(true)}
        />
        <Text style={styles.hexText}>{value}</Text>
        <TouchableOpacity style={styles.changeButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.changeButtonText}>{t('color.pick')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('color.hex')}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <ColorPicker
              color={currentColor}
              onColorChange={(color) => setCurrentColor(color)}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
            />
          </View>

          <View style={styles.preview}>
            <View style={[styles.previewSwatch, { backgroundColor: currentColor }]} />
            <Text style={styles.previewHex}>{currentColor}</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>{t('color.save')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  hexText: { fontSize: 15, color: '#333', flex: 1 },
  changeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3B44AC' },
  changeButtonText: { color: '#3B44AC', fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeIcon: { fontSize: 18, color: '#888', padding: 4 },
  pickerContainer: { flex: 1, paddingVertical: 16 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 16 },
  previewSwatch: { width: 48, height: 48, borderRadius: 8 },
  previewHex: { fontSize: 18, fontWeight: '600', color: '#333' },
  confirmButton: { backgroundColor: '#3B44AC', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});