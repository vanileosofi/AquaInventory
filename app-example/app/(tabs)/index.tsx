import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORES_EJEMPLO = [
  {
    id: '1',
    name: 'Ultramarine',
    brand: 'Van Gogh',
    format: 'pastilla',
    color: '#3B44AC',
    family: 'Azules',
    qty: 'full',
  },
  {
    id: '2',
    name: 'Cadmium Yellow',
    brand: 'Winsor & Newton',
    format: 'pomo',
    color: '#FFD700',
    family: 'Amarillos',
    qty: 'half',
  },
  {
    id: '3',
    name: 'Burnt Sienna',
    brand: 'Van Gogh',
    format: 'pastilla',
    color: '#8B4513',
    family: 'Marrones y tierras',
    qty: 'low',
  },
];

const QTY_EMOJI: Record<string, string> = {
  full: '🟢',
  half: '🟡',
  low: '🟠',
  empty: '🔴',
};

export default function InventarioScreen() {
  const [colores] = useState(COLORES_EJEMPLO);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🎨 Mi Inventario</Text>
      <FlatList
        data={colores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={[styles.muestra, { backgroundColor: item.color }]} />
            <View style={styles.info}>
              <Text style={styles.nombre}>{item.name}</Text>
              <Text style={styles.marca}>{item.brand} · {item.format}</Text>
              <Text style={styles.familia}>{item.family}</Text>
            </View>
            <Text style={styles.qty}>{QTY_EMOJI[item.qty]}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.botonAgregar}>
        <Text style={styles.botonTexto}>+ Agregar color</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, borderRadius: 12, backgroundColor: '#f5f5f5' },
  muestra: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '600' },
  marca: { fontSize: 13, color: '#666', marginTop: 2 },
  familia: { fontSize: 12, color: '#999', marginTop: 2 },
  qty: { fontSize: 22 },
  botonAgregar: { backgroundColor: '#3B44AC', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});