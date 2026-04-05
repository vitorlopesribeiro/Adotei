import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { encryptCPF } from '../utils/cpf.utils';
import { RegisterFormData, UserAddress } from '../types';

// Cadastra novo usuário: cria conta no Firebase Auth + salva perfil no Firestore
export async function registerUser(data: RegisterFormData): Promise<void> {
  // Cria a conta de autenticação (e-mail/senha) no Firebase Auth
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = credential.user.uid;

  // Monta o objeto de endereço (complemento é opcional)
  const address: Record<string, string> = {
    street: data.address.street,
    number: data.address.number,
    neighborhood: data.address.neighborhood,
    city: data.address.city,
    state: data.address.state,
    zipCode: data.address.zipCode,
  };
  if (data.address.complement) address.complement = data.address.complement;

  try {
    // Salva o perfil completo na coleção "users" do Firestore
    // CPF é criptografado com AES-256 antes de salvar (LGPD)
    await setDoc(doc(db, 'users', uid), {
      uid,
      fullName: data.fullName,
      email: data.email,
      cpf: encryptCPF(data.cpf),
      phone: data.phone,
      address,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (firestoreError) {
    console.error('Firestore setDoc error:', firestoreError);
    throw firestoreError;
  }
}

// Autentica o usuário com e-mail e senha no Firebase Auth
export async function loginUser(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// Desloga o usuário atual (limpa a sessão do Firebase Auth)
export async function logoutUser(): Promise<void> {
  return signOut(auth);
}

// Atualiza telefone e endereço do usuário no Firestore
export async function updateUserProfile(
  uid: string,
  data: { phone: string; address: UserAddress }
): Promise<void> {
  const address: Record<string, string> = {
    street: data.address.street,
    number: data.address.number,
    neighborhood: data.address.neighborhood,
    city: data.address.city,
    state: data.address.state,
    zipCode: data.address.zipCode,
  };
  if (data.address.complement) address.complement = data.address.complement;

  await updateDoc(doc(db, 'users', uid), {
    phone: data.phone,
    address,
    updatedAt: serverTimestamp(),
  });
}

// Retorna o usuário atualmente autenticado (ou null se deslogado)
export function getCurrentUser() {
  return auth.currentUser;
}
