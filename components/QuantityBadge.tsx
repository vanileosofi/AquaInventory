import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  quantity: 'full' | 'half' | 'low' | 'empty';
  inUse: boolean;
}

const BG: Record<string, string> = {
  full:  '#4CAF50',
  half:  '#FFC107',
  low:   '#FF9800',
  empty: '#F44336',
};

export default function QuantityBadge({ quantity, inUse }: Props) {
  const { t } = useTranslation();
  const level = inUse ? quantity : 'full';

  return (
    <View style={[styles.badge, { backgroundColor: BG[level] }]}>
      <Text style={styles.label}>{t(`quantity.${level}`).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
