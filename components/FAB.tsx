import { router, usePathname } from 'expo-router';
import { Camera, Pencil, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FAB() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  // Collapse whenever the active route changes
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  const handleItemPress = (action: () => void) => {
    setExpanded(false);
    action();
  };

  // Items defined in the order they should appear bottom → top (closest to FAB first)
  const items = [
    {
      label: t('fab.new_color'),
      icon: <Pencil size={20} color="#fff" />,
      onPress: () => router.push('/add-color'),
    },
    {
      label: t('fab.recognize'),
      icon: <Camera size={20} color="#fff" />,
      onPress: () => router.push('/camera'),
    },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">

      {/* Dark overlay — tap to collapse */}
      {expanded && (
        <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* FAB stack anchored bottom-right */}
      <View style={[styles.fabStack, { bottom: 24 + insets.bottom }]} pointerEvents="box-none">

        {/* Secondary buttons rendered top → bottom (reversed so Gallery is farthest from FAB) */}
        {expanded &&
          [...items].reverse().map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.itemRow}
              onPress={() => handleItemPress(item.onPress)}
              activeOpacity={0.8}
            >
              <View style={styles.labelBubble}>
                <Text style={styles.labelText}>{item.label}</Text>
              </View>
              <View style={styles.miniBtn}>{item.icon}</View>
            </TouchableOpacity>
          ))}

        {/* Main FAB */}
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={() => setExpanded(prev => !prev)}
          activeOpacity={0.85}
        >
          {expanded ? <X size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  fabStack: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelBubble: {
    backgroundColor: 'rgba(20, 20, 30, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  miniBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3B44AC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mainBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B44AC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
