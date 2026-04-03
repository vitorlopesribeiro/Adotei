import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: FirebaseUser | null;
  initialized: boolean;
}

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => {
    set({ user, initialized: true });
  });

  return {
    user: null,
    initialized: false,
  };
});
