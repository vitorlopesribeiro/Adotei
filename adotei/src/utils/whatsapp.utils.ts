import { Linking, Alert } from 'react-native';

export function openWhatsApp(phone: string): void {
  const cleaned = phone.replace(/\D/g, '');
  const url = `https://wa.me/55${cleaned}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Atenção', 'WhatsApp não encontrado. Tente contato por telefone.');
  });
}
