// Funções do Firebase Auth para criar conta, fazer login, logout e observar estado
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential,
  User as FirebaseUser,
} from 'firebase/auth';

// Funções do Firestore para criar e buscar documentos
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Instâncias configuradas do Firebase (auth, banco e storage)
import { auth, db } from '@/src/config/firebase';

// Utilitário de criptografia do CPF com AES-256
import { encryptCPF } from '@/src/utils/cpf.utils';

// Schema Zod de validação dos dados do formulário de cadastro
import { userSchema } from '@/src/schemas/user.schema';

// Tipos TypeScript do projeto
import type { User, RegisterFormData } from '@/src/types';

// ─── Cadastro de novo usuário ─────────────────────────────────────────────────

export async function registerUser(data: RegisterFormData): Promise<void> {
  // 1. Valida todos os campos com o schema Zod — lança erro se algo for inválido
  userSchema.parse(data);

  // 2. Cria a conta no Firebase Authentication (gerencia e-mail, senha e token)
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );

  // O UID é gerado automaticamente pelo Firebase Auth e serve como ID do documento
  const uid = credential.user.uid;

  // 3. Criptografa o CPF com AES-256 antes de salvar no banco (LGPD)
  const encryptedCpf = encryptCPF(data.cpf);

  // 4. Monta o documento do usuário para o Firestore
  //    A senha NUNCA é armazenada aqui — fica exclusivamente no Firebase Auth
  const userDoc: Omit<User, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid,
    fullName: data.fullName,
    email: data.email,
    cpf: encryptedCpf,                          // CPF já criptografado
    phone: data.phone.replace(/\D/g, ''),        // Remove formatação, guarda só dígitos
    address: {
      street: data.address.street,
      number: data.address.number,
      complement: data.address.complement,
      neighborhood: data.address.neighborhood,
      city: data.address.city,
      state: data.address.state.toUpperCase(),   // Sigla sempre em maiúsculo: "sp" → "SP"
      zipCode: data.address.zipCode.replace(/\D/g, ''), // Remove traço do CEP
    },
    createdAt: serverTimestamp(), // Timestamp gerado pelo servidor do Firebase
    updatedAt: serverTimestamp(),
  };

  // 5. Salva o documento no Firestore usando o UID como ID — garante unicidade
  await setDoc(doc(db, 'users', uid), userDoc);
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  // Autentica o usuário no Firebase Auth e retorna as credenciais (token, uid, etc.)
  return signInWithEmailAndPassword(auth, email, password);
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  // Encerra a sessão do usuário e invalida o token local
  return signOut(auth);
}

// ─── Usuário atual (síncrono) ─────────────────────────────────────────────────

export function getCurrentUser(): FirebaseUser | null {
  // Retorna o usuário Firebase logado no momento, ou null se não houver sessão ativa
  // Atenção: pode retornar null durante o carregamento inicial — prefira o store Zustand
  return auth.currentUser;
}

// ─── Perfil completo do Firestore ─────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<User | null> {
  // Busca o documento do usuário na coleção "users" pelo UID do Firebase Auth
  const snap = await getDoc(doc(db, 'users', uid));

  // Retorna null se o documento não existir (ex.: usuário criado fora do app)
  if (!snap.exists()) return null;

  return snap.data() as User;
}

// ─── Listener de estado de autenticação ──────────────────────────────────────

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  // Assina o listener do Firebase que dispara sempre que o estado muda:
  // login, logout ou expiração de token.
  // Retorna a função de cancelamento (unsubscribe) para evitar memory leaks.
  return onAuthStateChanged(auth, callback);
}
