import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import seedData from '../data/seedColors';
import { migrateQuantityFix } from '../storage/colors';

export default function DevSeedScreen() {
  const [status, setStatus] = useState('');

  const handleSeed = async () => {
    setStatus('Cargando...');
    await AsyncStorage.setItem('aqua_colors', JSON.stringify(seedData));
    setStatus(`✅ ${seedData.length} colores cargados`);
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem('aqua_colors');
    setStatus('🗑️ Inventario borrado');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dev Tools</Text>
      <Text style={styles.subtitle}>{seedData.length} colores listos para cargar</Text>

      <TouchableOpacity style={styles.button} onPress={handleSeed}>
        <Text style={styles.buttonText}>Cargar inventario completo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleClear}>
        <Text style={styles.buttonText}>Borrar inventario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.warning]} onPress={async () => {
        await migrateQuantityFix();
        Alert.alert('✅', 'Cantidad corregida: colores sin usar marcados como llenos.');
      }}>
        <Text style={styles.buttonText}>Fix quantity data</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 32 },
  button: { backgroundColor: '#3B44AC', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  danger: { backgroundColor: '#ff4444' },
  warning: { backgroundColor: '#FF9800' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  status: { fontSize: 16, textAlign: 'center', marginTop: 24, color: '#333' },
  back: { padding: 16, alignItems: 'center', marginTop: 16 },
  backText: { color: '#888', fontSize: 15 },
});