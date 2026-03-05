import { cpf } from 'cpf-cnpj-validator';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.EXPO_PUBLIC_CPF_SECRET || 'chave-fallback-segura';

// Valida se o CPF é real (dígito verificador)
export const isValidCPF = (value: string) => cpf.isValid(value);

// Criptografa o CPF antes de salvar no Firestore [cite: 11]
export const encryptCPF = (value: string): string => {
  return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
};