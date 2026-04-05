import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadPetPhoto } from './storage.service';
import { Pet, PetStatus, PetFilters, CreatePetFormData } from '../types';

// Cadastra um novo pet: salva no Firestore + faz upload da foto no Cloudinary
export async function createPet(
  data: CreatePetFormData,
  imageUri: string,
  ownerId: string
): Promise<string> {
  // Primeiro cria o documento no Firestore (sem foto) para obter o ID
  const docRef = await addDoc(collection(db, 'pets'), {
    ownerId,
    name: data.name,
    species: data.species,
    ageMonths: data.ageMonths,
    sex: data.sex,
    size: data.size,
    furColor: data.furColor,
    furLength: data.furLength,
    eyeColor: data.eyeColor,
    neutered: data.neutered,
    description: data.description,
    // Monta o meetingLocation com o formattedAddress concatenado
    meetingLocation: {
      ...data.meetingLocation,
      formattedAddress: buildFormattedAddress(data.meetingLocation),
    },
    photoUrl: '',                      // Placeholder até o upload concluir
    status: 'available' as PetStatus,  // Todo pet começa como disponível
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Faz upload da foto para o Cloudinary usando o ID do documento como nome
  const photoUrl = await uploadPetPhoto(docRef.id, imageUri);
  // Atualiza o documento com a URL da foto hospedada
  await updateDoc(docRef, { photoUrl });

  return docRef.id;
}

// Busca pets disponíveis com filtros opcionais (espécie, sexo, porte, etc.)
// Sempre filtra por status "available" como base
export async function getPets(filters?: PetFilters): Promise<Pet[]> {
  const constraints = [where('status', '==', 'available')];

  // Adiciona filtros dinâmicos à query do Firestore
  if (filters?.species) constraints.push(where('species', '==', filters.species));
  if (filters?.sex) constraints.push(where('sex', '==', filters.sex));
  if (filters?.size) constraints.push(where('size', '==', filters.size));
  if (filters?.furLength) constraints.push(where('furLength', '==', filters.furLength));
  if (filters?.neutered !== undefined) constraints.push(where('neutered', '==', filters.neutered));
  // Filtros por localização (campo aninhado no Firestore)
  if (filters?.city) constraints.push(where('meetingLocation.city', '==', filters.city));
  if (filters?.neighborhood) constraints.push(where('meetingLocation.neighborhood', '==', filters.neighborhood));

  const q = query(collection(db, 'pets'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
}

// Busca um pet específico pelo ID do documento no Firestore
export async function getPetById(petId: string): Promise<Pet> {
  const snapshot = await getDoc(doc(db, 'pets', petId));
  if (!snapshot.exists()) throw new Error('Pet não encontrado.');
  return { id: snapshot.id, ...snapshot.data() } as Pet;
}

// Atualiza o status do pet (available → pending → adopted)
export async function updatePetStatus(petId: string, status: PetStatus): Promise<void> {
  await updateDoc(doc(db, 'pets', petId), { status, updatedAt: serverTimestamp() });
}

// Busca todos os pets de um doador específico (para a tela "Meus Pets")
export async function getUserPets(userId: string): Promise<Pet[]> {
  const q = query(collection(db, 'pets'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
}

// Atualiza os dados de um pet existente (apenas se status "available")
// Opcionalmente atualiza a foto se uma nova imageUri for fornecida
export async function updatePet(
  petId: string,
  data: CreatePetFormData,
  newImageUri?: string
): Promise<void> {
  const petSnap = await getDoc(doc(db, 'pets', petId));
  if (!petSnap.exists()) throw new Error('Pet não encontrado.');

  const pet = petSnap.data() as Pet;
  if (pet.status !== 'available') {
    throw new Error('Só é possível editar pets com status disponível.');
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    species: data.species,
    ageMonths: data.ageMonths,
    sex: data.sex,
    size: data.size,
    furColor: data.furColor,
    furLength: data.furLength,
    eyeColor: data.eyeColor,
    neutered: data.neutered,
    description: data.description,
    meetingLocation: {
      ...data.meetingLocation,
      formattedAddress: buildFormattedAddress(data.meetingLocation),
    },
    updatedAt: serverTimestamp(),
  };

  // Se uma nova foto foi selecionada, faz upload e atualiza a URL
  if (newImageUri) {
    const photoUrl = await uploadPetPhoto(petId, newImageUri);
    updateData.photoUrl = photoUrl;
  }

  await updateDoc(doc(db, 'pets', petId), updateData);
}

// Exclui um pet do Firestore (apenas se status "available" e pelo dono)
export async function deletePet(petId: string, userId: string): Promise<void> {
  const petSnap = await getDoc(doc(db, 'pets', petId));
  if (!petSnap.exists()) throw new Error('Pet não encontrado.');

  const pet = petSnap.data() as Pet;

  if (pet.ownerId !== userId) {
    throw new Error('Apenas o dono pode excluir este pet.');
  }
  if (pet.status !== 'available') {
    throw new Error('Só é possível excluir pets com status disponível.');
  }

  await deleteDoc(doc(db, 'pets', petId));
}

// Concatena os campos de endereço em uma string legível para exibição e Google Maps
function buildFormattedAddress(location: CreatePetFormData['meetingLocation']): string {
  const parts = [location.street, location.number];
  if (location.complement) parts.push(location.complement);
  parts.push(location.neighborhood, location.city, location.state);
  return parts.join(', ');
}
