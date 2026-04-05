import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Overlay de loading centralizado — usado em telas que aguardam carregamento inicial
export function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E87722" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
