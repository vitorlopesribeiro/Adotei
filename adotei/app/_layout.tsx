import 'react-native-get-random-values';
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/auth.store';

export default function RootLayout() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!initialized) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user, initialized]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
