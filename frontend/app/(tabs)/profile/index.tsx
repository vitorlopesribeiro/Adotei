import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🐾 Perfil</Text>
      <Text style={styles.sub}>TASK-020 — a implementar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold', color: '#E87722' },
  sub: { fontSize: 14, color: '#888', marginTop: 8 },
});