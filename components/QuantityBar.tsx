import { StyleSheet, View } from 'react-native';

interface Props {
  quantity: string;
  inUse: boolean;
}

const FILL: Record<string, { width: string; color: string }> = {
  full:  { width: '100%', color: '#4CAF50' },
  half:  { width: '50%',  color: '#FFC107' },
  low:   { width: '25%',  color: '#FF9800' },
  empty: { width: '0%',   color: 'transparent' },
};

export default function QuantityBar({ quantity, inUse }: Props) {
  const fill = inUse ? (FILL[quantity] ?? FILL.full) : FILL.full;

  return (
    <View style={styles.track}>
      {fill.width !== '0%' && (
        <View style={[styles.fill, { width: fill.width as any, backgroundColor: fill.color }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
