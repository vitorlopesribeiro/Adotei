// Funções de inicialização do Firebase SDK
import { initializeApp, getApps } from 'firebase/app';

// Módulo de autenticação (login, cadastro, sessão)
import { getAuth } from 'firebase/auth';

// Módulo do banco de dados NoSQL em tempo real
import { getFirestore } from 'firebase/firestore';

// Módulo de armazenamento de arquivos (fotos dos pets)
import { getStorage } from 'firebase/storage';

// ─── Configuração do projeto Firebase ────────────────────────────────────────

// Todas as variáveis vêm do arquivo .env — nunca devem ser expostas no código
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ─── Inicialização segura ─────────────────────────────────────────────────────

// Verifica se o app já foi inicializado antes de criar uma nova instância.
// Isso evita o erro "Firebase App named '[DEFAULT]' already exists"
// que ocorre durante o hot-reload do Expo Go em desenvolvimento.
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)   // Primeira inicialização
  : getApps()[0];                   // Reutiliza instância já existente

// ─── Exportação dos serviços ──────────────────────────────────────────────────

// Instância de autenticação — usada em auth.service.ts
export const auth = getAuth(app);

// Instância do Firestore — usada em todos os services (pets, adoptions, etc.)
export const db = getFirestore(app);

// Instância do Storage — usada em storage.service.ts para upload de fotos
export const storage = getStorage(app);
