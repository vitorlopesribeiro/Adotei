import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadPetPhoto } from './storage.service';
import { Pet, PetStatus, PetFilters, CreatePetFormData } from '../types';

export async function createPet(
  data: CreatePetFormData,
  imageUri: string,
  ownerId: string
): Promise<string> {
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
    meetingLocation: {
      ...data.meetingLocation,
      formattedAddress: buildFormattedAddress(data.meetingLocation),
    },
    photoUrl: '',
    status: 'available' as PetStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const photoUrl = await uploadPetPhoto(docRef.id, imageUri);
  await updateDoc(docRef, { photoUrl });

  return docRef.id;
}

export async function getPets(filters?: PetFilters): Promise<Pet[]> {
  const constraints = [where('status', '==', 'available')];

  if (filters?.species) constraints.push(where('species', '==', filters.species));
  if (filters?.sex) constraints.push(where('sex', '==', filters.sex));
  if (filters?.size) constraints.push(where('size', '==', filters.size));
  if (filters?.furLength) constraints.push(where('furLength', '==', filters.furLength));
  if (filters?.neutered !== undefined) constraints.push(where('neutered', '==', filters.neutered));
  if (filters?.city) constraints.push(where('meetingLocation.city', '==', filters.city));
  if (filters?.neighborhood) constraints.push(where('meetingLocation.neighborhood', '==', filters.neighborhood));

  const q = query(collection(db, 'pets'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
}

export async function getPetById(petId: string): Promise<Pet> {
  const snapshot = await getDoc(doc(db, 'pets', petId));
  if (!snapshot.exists()) throw new Error('Pet não encontrado.');
  return { id: snapshot.id, ...snapshot.data() } as Pet;
}

export async function updatePetStatus(petId: string, status: PetStatus): Promise<void> {
  await updateDoc(doc(db, 'pets', petId), { status, updatedAt: serverTimestamp() });
}

export async function getUserPets(userId: string): Promise<Pet[]> {
  const q = query(collection(db, 'pets'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
}

function buildFormattedAddress(location: CreatePetFormData['meetingLocation']): string {
  const parts = [location.street, location.number];
  if (location.complement) parts.push(location.complement);
  parts.push(location.neighborhood, location.city, location.state);
  return parts.join(', ');
}
