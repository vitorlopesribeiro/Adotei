import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';

// Tela inicial (entry point) — redireciona baseado no estado de autenticação
export default function Index() {
  const { user, initialized } = useAuthStore();

  // Enquanto o Firebase Auth ainda não resolveu o estado, mostra loading
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E87722" />
      </View>
    );
  }

  // Usuário logado → catálogo; deslogado → tela de login
  if (user) {
    return <Redirect href="/(tabs)/catalog" />;
  }

  return <Redirect href="/(auth)/login" />;
}
