// Biblioteca de criptografia simétrica (AES, SHA, etc.)
import CryptoJS from 'crypto-js';

// Chave secreta lida das variáveis de ambiente — nunca deve ser exposta no código
const SECRET_KEY = process.env.EXPO_PUBLIC_CPF_SECRET!;

// Aviso em desenvolvimento caso a variável não esteja configurada no .env
if (!SECRET_KEY) {
  console.warn('[cpf.utils] EXPO_PUBLIC_CPF_SECRET não está definida. A criptografia do CPF falhará.');
}

/**
 * Criptografa o CPF com AES-256 antes de salvar no Firestore.
 * Remove qualquer formatação (pontos e traço) antes de cifrar.
 */
export function encryptCPF(cpf: string): string {
  // Remove pontos e traço do CPF formatado: "123.456.789-09" → "12345678909"
  const digitsOnly = cpf.replace(/\D/g, '');

  // Cifra com AES usando a chave secreta e retorna a string base64 resultante
  return CryptoJS.AES.encrypt(digitsOnly, SECRET_KEY).toString();
}

/**
 * Descriptografa o CPF armazenado no Firestore.
 * Usar apenas em contextos internos — nunca expor o CPF decifrado na UI.
 */
export function decryptCPF(encrypted: string): string {
  // Decifra o texto cifrado usando a mesma chave secreta
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);

  // Converte os bytes resultantes de volta para string UTF-8 legível
  return bytes.toString(CryptoJS.enc.Utf8);
}
