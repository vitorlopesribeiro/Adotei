// Tipo Timestamp do Firestore — representa datas/horas no banco
import { Timestamp } from 'firebase/firestore';

// ─── Usuário ──────────────────────────────────────────────────────────────────

// Endereço residencial do usuário (usado também como fallback de localização)
export interface UserAddress {
  street: string;
  number: string;
  complement?: string;   // Campo opcional
  neighborhood: string;
  city: string;
  state: string;         // Sigla do estado: "SP", "RJ", etc.
  zipCode: string;       // Apenas dígitos, sem traço: "01310100"
}

// Perfil completo do usuário salvo na coleção "users" do Firestore
export interface User {
  uid: string;           // ID gerado pelo Firebase Auth — também é o ID do documento
  fullName: string;
  email: string;
  cpf: string;           // Armazenado criptografado com AES-256 (nunca em texto puro)
  phone: string;         // Apenas dígitos, com DDD: "11987654321"
  address: UserAddress;
  createdAt: Timestamp;  // Gerado pelo servidor no momento do cadastro
  updatedAt: Timestamp;  // Atualizado a cada modificação do perfil
}

// Dados enviados pelo formulário de cadastro (inclui senha — não vai para o Firestore)
export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string; // Gerenciada exclusivamente pelo Firebase Auth
  cpf: string;
  phone: string;
  address: UserAddress;
}

// ─── Pet ──────────────────────────────────────────────────────────────────────

// Tipos enumerados dos atributos do pet
export type PetSpecies  = 'dog' | 'cat';
export type PetSex      = 'male' | 'female';
export type PetSize     = 'small' | 'medium' | 'large';
export type FurLength   = 'short' | 'medium' | 'long' | 'none';

// Status do pet no fluxo de adoção
export type PetStatus   = 'available' | 'pending' | 'adopted';

// Localização do ponto de encontro para entrega do pet
// Pode ser diferente do endereço pessoal do doador (regra de negócio RN07)
export interface MeetingLocation {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string; // Montado automaticamente: "Rua das Flores, 142, Vila Madalena, São Paulo, SP"
}

// Documento completo do pet na coleção "pets" do Firestore
export interface Pet {
  id: string;                    // ID gerado automaticamente pelo Firestore
  ownerId: string;               // UID do doador — referência para users/{uid}
  name: string;
  species: PetSpecies;
  ageMonths: number;             // Idade em meses (ex.: 18 = 1 ano e 6 meses)
  sex: PetSex;
  size: PetSize;
  furColor: string | null;       // null quando o animal não tem pelos
  furLength: FurLength;
  eyeColor: string;
  neutered: boolean;
  description: string;
  photoUrl: string;              // URL pública da foto no Firebase Storage
  meetingLocation: MeetingLocation;
  status: PetStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Adoção ───────────────────────────────────────────────────────────────────

// Status do pedido de adoção na máquina de estados
export type AdoptionStatus = 'pending' | 'confirmed' | 'rejected';

// Documento de pedido de adoção na coleção "adoptions"
export interface Adoption {
  id: string;                       // ID gerado automaticamente pelo Firestore
  petId: string;                    // Referência para pets/{id}
  adopterId: string;                // UID de quem quer adotar — ref: users/{uid}
  donorId: string;                  // UID do dono do pet — ref: users/{uid}
  status: AdoptionStatus;
  emailSent: boolean;               // Controle anti-reenvio do e-mail de confirmação
  requestedAt: Timestamp;           // Data em que o pedido foi criado
  resolvedAt: Timestamp | null;     // Data da confirmação ou recusa; null enquanto pendente
}

// ─── E-mail ───────────────────────────────────────────────────────────────────

// Documento escrito na coleção "mail" para disparar o Firebase Trigger Email
export interface MailDocument {
  to: string[];          // Lista de destinatários: [adotante, doador]
  message: {
    subject: string;     // Assunto do e-mail
    html: string;        // Corpo em HTML — gerado por generateAdoptionDocument()
  };
}

// ─── Labels em português para exibição na UI ─────────────────────────────────

// Mapeia os valores internos (inglês) para os rótulos exibidos ao usuário (pt-BR)

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: 'Cão',
  cat: 'Gato',
};

export const SEX_LABEL: Record<PetSex, string> = {
  male: 'Macho',
  female: 'Fêmea',
};

export const SIZE_LABEL: Record<PetSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

export const FUR_LEN_LABEL: Record<FurLength, string> = {
  short: 'Curto',
  medium: 'Médio',
  long: 'Longo',
  none: 'Sem pelo',
};

export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  available: 'Disponível',
  pending: 'Pendente',
  adopted: 'Adotado',
};

export const ADOPT_STATUS_LABEL: Record<AdoptionStatus, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  rejected: 'Recusado',
};
