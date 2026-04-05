import { Tabs } from 'expo-router';

// Layout das tabs principais do app (navegação inferior)
// 4 abas: Catálogo, Meus Pets, Adoções e Perfil
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="catalog" options={{ title: 'Catálogo' }} />
      <Tabs.Screen name="my-pets" options={{ title: 'Meus Pets' }} />
      <Tabs.Screen name="adoptions" options={{ title: 'Adoções' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
