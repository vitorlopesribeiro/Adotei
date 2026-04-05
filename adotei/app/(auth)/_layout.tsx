import { Stack } from 'expo-router';

// Layout do grupo de autenticação (login e cadastro) — sem header
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
