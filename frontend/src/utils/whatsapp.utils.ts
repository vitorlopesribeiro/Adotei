import { Linking, Alert } from 'react-native';

export function openWhatsApp(phone: string): void {
  const cleaned = phone.replace(/\D/g, ''); // Remove tudo que não é número
  const url = `https://wa.me/55${cleaned}`; // Adiciona prefixo do Brasil
  
  Linking.openURL(url).catch(() => {
    Alert.alert('Erro', 'Certifique-se de que o WhatsApp está instalado.');
  });
}