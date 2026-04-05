import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: FirebaseUser | null;
  initialized: boolean;
}

// Store global de autenticação (Zustand)
// Escuta mudanças no estado de auth do Firebase em tempo real
export const useAuthStore = create<AuthState>((set) => {
  // Listener que dispara sempre que o usuário loga, desloga ou o app reinicia
  onAuthStateChanged(auth, (user) => {
    set({ user, initialized: true });
  });

  return {
    user: null,          // Usuário do Firebase Auth (null = deslogado)
    initialized: false,  // Flag que indica se o estado inicial de auth já foi resolvido
  };
});
