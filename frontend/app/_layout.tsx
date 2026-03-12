import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '@/src/config/firebase'; // O '@' é um atalho para a pasta raiz do projeto

export default function RootLayout() {
  const router = useRouter(); // Ferramenta para mudar de tela (tipo um GPS)
  const segments = useSegments(); // Diz ao código em qual "pasta" o usuário está agora

  useEffect(() => {
    // Essa função do Firebase fica vigiando se o usuário está logado ou não
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      
      // Verifica se o usuário está atualmente dentro da pasta (auth), ou seja, nas telas de Login/Cadastro
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        // 1. Se NÃO tem usuário logado E ele NÃO está na tela de login:
        // Força ele a ir para o Login.
        router.replace('/(auth)/login');
      } 
      else if (user && inAuthGroup) {
        // 2. Se JÁ tem usuário logado MAS ele ainda está tentando ver a tela de login:
        // Manda ele direto para o Catálogo dentro das abas.
        router.replace('/(tabs)');
      }
    });

    // Limpa a vigilância quando o app fecha para não gastar memória
    return unsubscribe; 
  }, [segments]); // Toda vez que o usuário mudar de tela, o código checa a segurança de novo

  // O Stack organiza as telas como uma "pilha". 
  // O headerShown: false esconde aquela barra feia no topo que o Expo coloca por padrão.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}