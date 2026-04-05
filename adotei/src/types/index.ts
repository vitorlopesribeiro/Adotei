import { Timestamp } from 'firebase/firestore';

// ─── Enums (tipos literais) ─────────────────────────────────────────────────

export type PetSpecies = 'dog' | 'cat';
export type PetSex = 'male' | 'female';
export type PetSize = 'small' | 'medium' | 'large';
export type FurLength = 'short' | 'medium' | 'long' | 'none';
export type PetStatus = 'available' | 'pending' | 'adopted';
export type AdoptionStatus = 'pending' | 'confirmed' | 'rejected';

// ─── Labels PT-BR (mapeamento enum → texto para exibição na UI) ─────────────

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

export const FUR_LENGTH_LABEL: Record<FurLength, string> = {
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

export const ADOPTION_STATUS_LABEL: Record<AdoptionStatus, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  rejected: 'Recusado',
};

// ─── Interfaces (espelham as coleções do Firestore) ─────────────────────────

// Endereço residencial do usuário (subcampo de User)
export interface UserAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Documento da coleção "users" — perfil completo do usuário
export interface User {
  uid: string;
  fullName: string;
  email: string;
  cpf: string;           // Armazenado criptografado (AES-256)
  phone: string;
  address: UserAddress;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Ponto de encontro do pet (pode ser diferente do endereço do doador — RN07)
export interface MeetingLocation {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string; // Endereço concatenado para exibição e Google Maps
}

// Documento da coleção "pets" — dados completos do animal
export interface Pet {
  id: string;
  ownerId: string;          // UID do doador que cadastrou o pet
  name: string;
  species: PetSpecies;
  ageMonths: number;        // Idade em meses para precisão (ex: 3 meses, 18 meses)
  sex: PetSex;
  size: PetSize;
  furColor: string | null;  // null quando furLength é "none"
  furLength: FurLength;
  eyeColor: string;
  neutered: boolean;
  description: string;
  photoUrl: string;         // URL da foto hospedada no Cloudinary
  meetingLocation: MeetingLocation;
  status: PetStatus;        // available → pending → adopted (fluxo de adoção)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Documento da coleção "adoptions" — pedido de adoção
export interface Adoption {
  id: string;
  petId: string;
  adopterId: string;        // UID de quem quer adotar
  donorId: string;          // UID do dono do pet
  status: AdoptionStatus;   // pending → confirmed/rejected
  emailSent: boolean;       // Marca se o e-mail de confirmação já foi gerado
  requestedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

// Documento da coleção "mail" — fila do Firebase Trigger Email Extension
export interface MailDocument {
  to: string[];             // Destinatários (adotante + doador)
  message: {
    subject: string;
    html: string;           // HTML do documento simbólico de adoção
  };
}

// ─── Tipos de formulário (usados com React Hook Form) ───────────────────────

// Dados do formulário de cadastro de usuário
export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Dados do formulário de cadastro de pet
export interface CreatePetFormData {
  name: string;
  species: PetSpecies;
  ageMonths: number;
  sex: PetSex;
  size: PetSize;
  furColor: string | null;
  furLength: FurLength;
  eyeColor: string;
  neutered: boolean;
  description: string;
  meetingLocation: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Filtros opcionais aplicados na busca de pets no catálogo
export interface PetFilters {
  species?: PetSpecies;
  sex?: PetSex;
  size?: PetSize;
  furLength?: FurLength;
  neutered?: boolean;
  city?: string;
  neighborhood?: string;
}
