import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { encryptCPF } from '../utils/cpf.utils';
import { RegisterFormData } from '../types';

export async function registerUser(data: RegisterFormData): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = credential.user.uid;

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

export async function loginUser(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  return signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
