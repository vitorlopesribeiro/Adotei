import { Linking, Alert } from 'react-native';

// Abre o Google Maps com o endereço do ponto de encontro do pet
export function openGoogleMaps(formattedAddress: string): void {
  // Codifica o endereço para uso seguro na URL
  const encoded = encodeURIComponent(formattedAddress);
  const url = `https://maps.google.com/?q=${encoded}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
  });
}
