// Polyfill obrigatório para crypto-js funcionar no React Native
import 'react-native-get-random-values';
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/auth.store';

// Layout raiz do app — gerencia a navegação global e o redirect de autenticação
export default function RootLayout() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  // Evita redirect no primeiro render (aguarda o estado de auth ser resolvido)
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!initialized) return;

    // Pula o primeiro render para evitar redirect antes da tela montar
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Se o usuário deslogou, redireciona para a tela de login
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user, initialized]);

  return (
    <SafeAreaProvider>
      {/* Stack raiz: esconde headers — cada grupo gerencia seu próprio layout */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
