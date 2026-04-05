// Polyfill necessário para crypto-js funcionar no React Native
import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

// Chave secreta para criptografia AES-256 do CPF (variável de ambiente)
const SECRET_KEY = process.env.EXPO_PUBLIC_CPF_SECRET!;

// Criptografa o CPF antes de salvar no Firestore (LGPD)
export function encryptCPF(cpfValue: string): string {
  return CryptoJS.AES.encrypt(cpfValue, SECRET_KEY).toString();
}

// Descriptografa o CPF para exibição quando necessário
export function decryptCPF(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
