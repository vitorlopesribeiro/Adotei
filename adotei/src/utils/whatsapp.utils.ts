import { Linking, Alert } from 'react-native';

// Abre o WhatsApp com o número do doador usando deep link
// Em caso de falha (WhatsApp não instalado), oferece opção de ligar diretamente (PRD Risco 5)
export async function openWhatsApp(phone: string): Promise<void> {
  // Remove caracteres não numéricos (máscaras) do telefone
  const cleaned = phone.replace(/\D/g, '');
  // Monta a URL com código do Brasil (+55)
  const whatsappUrl = `https://wa.me/55${cleaned}`;

  try {
    // Verifica se o dispositivo consegue abrir o deep link do WhatsApp
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback: oferece ligar diretamente para o número
      showPhoneFallback(cleaned);
    }
  } catch {
    // Fallback em caso de erro inesperado
    showPhoneFallback(cleaned);
  }
}

// Exibe alerta com opção de ligar por telefone quando WhatsApp não está disponível
function showPhoneFallback(phone: string): void {
  Alert.alert(
    'WhatsApp não disponível',
    'O WhatsApp não está instalado neste dispositivo. Deseja ligar para o doador?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ligar',
        onPress: () => {
          // Abre o discador nativo com o número do doador
          Linking.openURL(`tel:+55${phone}`).catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o telefone.');
          });
        },
      },
    ]
  );
}
