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

// Cria uma solicitação de adoção e muda o pet para "pending"
// Valida RN03 (não pode adotar próprio pet) e status disponível
export async function requestAdoption(petId: string, adopterId: string): Promise<string> {
  const petSnap = await getDoc(doc(db, 'pets', petId));
  if (!petSnap.exists()) throw new Error('Pet não encontrado.');

  const pet = petSnap.data() as Pet;

  // RN03: Usuário não pode solicitar adoção do próprio pet
  if (pet.ownerId === adopterId) {
    throw new Error('Você não pode solicitar adoção do próprio pet.');
  }

  // Só permite solicitação para pets com status "available"
  if (pet.status !== 'available') {
    throw new Error('Este pet não está disponível para adoção.');
  }

  // Cria o documento de adoção na coleção "adoptions"
  const docRef = await addDoc(collection(db, 'adoptions'), {
    petId,
    adopterId,
    donorId: pet.ownerId,
    status: 'pending',
    emailSent: false,
    requestedAt: serverTimestamp(),
    resolvedAt: null,
  });

  // Muda o status do pet para "pending" (RN05: reserva temporária)
  await updatePetStatus(petId, 'pending');

  return docRef.id;
}

// Confirma a adoção: muda status para "confirmed", pet para "adopted" e envia e-mail
// RN01: Só o doador pode chamar esta função
// RN05: Status muda automaticamente para "adopted" após confirmação
export async function confirmAdoption(adoptionId: string): Promise<void> {
  const adoptionSnap = await getDoc(doc(db, 'adoptions', adoptionId));
  if (!adoptionSnap.exists()) throw new Error('Solicitação não encontrada.');

  const adoption = { id: adoptionSnap.id, ...adoptionSnap.data() } as Adoption;

  if (adoption.status !== 'pending') {
    throw new Error('Esta solicitação já foi resolvida.');
  }

  // Atualiza o status da adoção para "confirmed"
  await updateDoc(doc(db, 'adoptions', adoptionId), {
    status: 'confirmed',
    resolvedAt: serverTimestamp(),
  });

  // RN05: Pet muda automaticamente para "adopted" (nunca volta — RN02)
  await updatePetStatus(adoption.petId, 'adopted');

  // Gera e envia o documento simbólico de adoção por e-mail
  await sendAdoptionEmail(adoption);
}

// Recusa a adoção: muda status para "rejected" e libera o pet de volta para "available"
// RN01: Só o doador pode chamar esta função
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

  // Pet volta a ficar disponível no catálogo
  await updatePetStatus(adoption.petId, 'available');
}

// Busca pedidos de adoção enviados pelo usuário (aba "Enviados")
export async function getSentAdoptions(userId: string): Promise<Adoption[]> {
  const q = query(collection(db, 'adoptions'), where('adopterId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Adoption));
}

// Busca pedidos de adoção recebidos pelo doador (aba "Recebidos")
export async function getReceivedAdoptions(userId: string): Promise<Adoption[]> {
  const q = query(collection(db, 'adoptions'), where('donorId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Adoption));
}

// Gera o documento simbólico de adoção em HTML e escreve na coleção "mail"
// O Firebase Trigger Email Extension envia automaticamente o e-mail
async function sendAdoptionEmail(adoption: Adoption): Promise<void> {
  // Busca dados do pet, adotante e doador em paralelo
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

  // HTML do documento simbólico de adoção (enviado por e-mail)
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

  // Escreve na coleção "mail" — Firebase Trigger Email Extension processa e envia
  await addDoc(collection(db, 'mail'), {
    to: [adopter.email, donor.email],
    message: {
      subject: `Adocao confirmada - ${pet.name}`,
      html,
    },
  });

  // Marca que o e-mail foi gerado com sucesso
  await updateDoc(doc(db, 'adoptions', adoption.id), { emailSent: true });
}
