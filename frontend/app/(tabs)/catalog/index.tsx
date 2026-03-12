import { View, Text, StyleSheet } from 'react-native';

// Placeholder temporário — será substituído na TASK-014
export default function CatalogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.title}>Catálogo</Text>
      <Text style={styles.sub}>Em breve os pets disponíveis aparecerão aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#E87722' },
  sub: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
});
