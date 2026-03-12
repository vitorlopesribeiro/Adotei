// Função do Zustand para criar o store global
import { create } from 'zustand';

// Tipo do usuário do Firebase Auth (contém uid, email, token, etc.)
import { User as FirebaseUser } from 'firebase/auth';

// Serviços de autenticação: listener de estado e busca de perfil
import { subscribeToAuthState, getUserProfile } from '../services/auth.service';

// Tipo completo do perfil salvo no Firestore
import type { User } from '../types';

// ─── Definição do estado e ações do store ────────────────────────────────────

interface AuthState {
  // Usuário do Firebase Auth — contém uid e token de sessão
  firebaseUser: FirebaseUser | null;

  // Perfil completo do Firestore — contém nome, CPF criptografado, endereço, etc.
  userProfile: User | null;

  // Verdadeiro enquanto o estado inicial de autenticação ainda está sendo resolvido
  isLoading: boolean;

  // Controle para evitar que o listener seja registrado mais de uma vez
  isInitialised: boolean;

  // ── Ações (setters) ──
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;

  // Limpa todos os dados do usuário (usado internamente após logout)
  clearAuth: () => void;

  // Inicializa o listener de autenticação — deve ser chamado UMA vez na raiz do app
  // Retorna a função de cancelamento do listener (unsubscribe)
  initialise: () => () => void;
}

// ─── Criação do store Zustand ─────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial: sem usuário logado, carregando
  firebaseUser: null,
  userProfile: null,
  isLoading: true,      // começa true porque o Firebase pode ter sessão salva
  isInitialised: false,

  // Atualiza apenas o usuário Firebase (token/uid)
  setFirebaseUser: (user) => set({ firebaseUser: user }),

  // Atualiza apenas o perfil do Firestore
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Atualiza o estado de carregamento
  setLoading: (loading) => set({ isLoading: loading }),

  // Zera todos os dados de autenticação — chamado após signOut
  clearAuth: () =>
    set({ firebaseUser: null, userProfile: null, isLoading: false }),

  /**
   * Registra o listener do Firebase que reage a login, logout e expiração de token.
   * Deve ser chamado uma única vez no _layout.tsx raiz.
   * Retorna a função de cancelamento para evitar memory leak.
   */
  initialise: () => {
    // Evita duplicar o listener caso initialise() seja chamado novamente
    if (get().isInitialised) return () => {};

    // Marca como inicializado antes de registrar o listener
    set({ isInitialised: true });

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário autenticado: atualiza o objeto Firebase Auth e ativa o loading
        set({ firebaseUser, isLoading: true });
        try {
          // Busca o perfil completo no Firestore usando o UID do Firebase Auth
          const profile = await getUserProfile(firebaseUser.uid);
          set({ userProfile: profile, isLoading: false });
        } catch {
          // Falha silenciosa: mantém o usuário Firebase mas sem perfil do Firestore
          set({ userProfile: null, isLoading: false });
        }
      } else {
        // Nenhum usuário autenticado: limpa todo o estado
        set({ firebaseUser: null, userProfile: null, isLoading: false });
      }
    });

    // Retorna o unsubscribe para ser chamado quando o componente raiz for desmontado
    return unsubscribe;
  },
}));
