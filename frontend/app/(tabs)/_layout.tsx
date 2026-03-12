import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E87722',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{ title: 'Catálogo', tabBarLabel: 'Catálogo' }}
      />
      <Tabs.Screen
        name="my-pets"
        options={{ title: 'Meus Pets', tabBarLabel: 'Meus Pets' }}
      />
      <Tabs.Screen
        name="adoptions"
        options={{ title: 'Adoções', tabBarLabel: 'Adoções' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tabs>
  );
}