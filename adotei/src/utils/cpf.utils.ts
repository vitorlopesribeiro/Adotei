import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.EXPO_PUBLIC_CPF_SECRET!;

export function encryptCPF(cpfValue: string): string {
  return CryptoJS.AES.encrypt(cpfValue, SECRET_KEY).toString();
}

export function decryptCPF(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
