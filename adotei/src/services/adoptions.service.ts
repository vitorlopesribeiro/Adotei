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
import { Adoption, Pet, User } from '../types';
import { updatePetStatus } from './pets.service';

export async function requestAdoption(petId: string, adopterId: string): Promise<string> {
  const petSnap = await getDoc(doc(db, 'pets', petId));
  if (!petSnap.exists()) throw new Error('Pet não encontrado.');

  const pet = petSnap.data() as Pet;

  if (pet.ownerId === adopterId) {
    throw new Error('Você não pode solicitar adoção do próprio pet.');
  }

  if (pet.status !== 'available') {
    throw new Error('Este pet não está disponível para adoção.');
  }

  const docRef = await addDoc(collection(db, 'adoptions'), {
    petId,
    adopterId,
    donorId: pet.ownerId,
    status: 'pending',
    emailSent: false,
    requestedAt: serverTimestamp(),
    resolvedAt: null,
  });

  await updatePetStatus(petId, 'pending');

  return docRef.id;
}

export async function confirmAdoption(adoptionId: string): Promise<void> {
  const adoptionSnap = await getDoc(doc(db, 'adoptions', adoptionId));
  if (!adoptionSnap.exists()) throw new Error('Solicitação não encontrada.');

  const adoption = { id: adoptionSnap.id, ...adoptionSnap.data() } as Adoption;

  if (adoption.status !== 'pending') {
    throw new Error('Esta solicitação já foi resolvida.');
  }

  await updateDoc(doc(db, 'adoptions', adoptionId), {
    status: 'confirmed',
    resolvedAt: serverTimestamp(),
  });

  await updatePetStatus(adoption.petId, 'adopted');

  await sendAdoptionEmail(adoption);
}

export async function rejectAdoption(adoptionId: string): Promise<void> {
  const adoptionSnap = await getDoc(doc(db, 'adoptions', adoptionId));
  if (!adoptionSnap.exists()) throw new Error('Solicitação não encontrada.');

  const adoption = { id: adoptionSnap.id, ...adoptionSnap.data() } as Adoption;

  if (adoption.status !== 'pending') {
    throw new Error('Esta solicitação já foi resolvida.');
  }

  await updateDoc(doc(db, 'adoptions', adoptionId), {
    status: 'rejected',
    resolvedAt: serverTimestamp(),
  });

  await updatePetStatus(adoption.petId, 'available');
}

export async function getSentAdoptions(userId: string): Promise<Adoption[]> {
  const q = query(collection(db, 'adoptions'), where('adopterId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Adoption));
}

export async function getReceivedAdoptions(userId: string): Promise<Adoption[]> {
  const q = query(collection(db, 'adoptions'), where('donorId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Adoption));
}

async function sendAdoptionEmail(adoption: Adoption): Promise<void> {
  const [petSnap, adopterSnap, donorSnap] = await Promise.all([
    getDoc(doc(db, 'pets', adoption.petId)),
    getDoc(doc(db, 'users', adoption.adopterId)),
    getDoc(doc(db, 'users', adoption.donorId)),
  ]);

  if (!petSnap.exists() || !adopterSnap.exists() || !donorSnap.exists()) return;

  const pet = petSnap.data() as Pet;
  const adopter = adopterSnap.data() as User;
  const donor = donorSnap.data() as User;

  const date = new Date().toLocaleDateString('pt-BR');
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #E87722; text-align: center;">Documento Simbolico de Adocao</h1>
      <p style="text-align: center;">Data: <strong>${date}</strong></p>
      <hr style="border: 1px solid #eee;" />
      <h2 style="color: #333;">Pet Adotado</h2>
      <p>Nome: <strong>${pet.name}</strong></p>
      <p>Especie: <strong>${pet.species === 'dog' ? 'Cao' : 'Gato'}</strong></p>
      <hr style="border: 1px solid #eee;" />
      <h2 style="color: #333;">Adotante</h2>
      <p>Nome: <strong>${adopter.fullName}</strong></p>
      <p>E-mail: <strong>${adopter.email}</strong></p>
      <hr style="border: 1px solid #eee;" />
      <h2 style="color: #333;">Doador</h2>
      <p>Nome: <strong>${donor.fullName}</strong></p>
      <p>E-mail: <strong>${donor.email}</strong></p>
      <hr style="border: 1px solid #eee;" />
      <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
        Este e um documento simbolico gerado pelo app Adotei.
      </p>
    </div>
  `;

  await addDoc(collection(db, 'mail'), {
    to: [adopter.email, donor.email],
    message: {
      subject: `Adocao confirmada - ${pet.name}`,
      html,
    },
  });

  await updateDoc(doc(db, 'adoptions', adoption.id), { emailSent: true });
}
