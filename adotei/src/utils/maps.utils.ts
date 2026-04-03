import { Linking, Alert } from 'react-native';

export function openGoogleMaps(formattedAddress: string): void {
  const encoded = encodeURIComponent(formattedAddress);
  const url = `https://maps.google.com/?q=${encoded}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
  });
}
