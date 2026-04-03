import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E87722" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/catalog" />;
  }

  return <Redirect href="/(auth)/login" />;
}
