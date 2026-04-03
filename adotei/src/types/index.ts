import { Timestamp } from 'firebase/firestore';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type PetSpecies = 'dog' | 'cat';
export type PetSex = 'male' | 'female';
export type PetSize = 'small' | 'medium' | 'large';
export type FurLength = 'short' | 'medium' | 'long' | 'none';
export type PetStatus = 'available' | 'pending' | 'adopted';
export type AdoptionStatus = 'pending' | 'confirmed' | 'rejected';

// ─── Labels PT-BR ────────────────────────────────────────────────────────────

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

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UserAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface User {
  uid: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  address: UserAddress;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MeetingLocation {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
}

export interface Pet {
  id: string;
  ownerId: string;
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
  photoUrl: string;
  meetingLocation: MeetingLocation;
  status: PetStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Adoption {
  id: string;
  petId: string;
  adopterId: string;
  donorId: string;
  status: AdoptionStatus;
  emailSent: boolean;
  requestedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

export interface MailDocument {
  to: string[];
  message: {
    subject: string;
    html: string;
  };
}

// ─── Form types ──────────────────────────────────────────────────────────────

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

export interface PetFilters {
  species?: PetSpecies;
  sex?: PetSex;
  size?: PetSize;
  furLength?: FurLength;
  neutered?: boolean;
  city?: string;
  neighborhood?: string;
}
