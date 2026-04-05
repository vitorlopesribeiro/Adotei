import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import { getPetById } from '../../../src/services/pets.service';
import { requestAdoption } from '../../../src/services/adoptions.service';
import { useAuthStore } from '../../../src/stores/auth.store';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { openWhatsApp } from '../../../src/utils/whatsapp.utils';
import { openGoogleMaps } from '../../../src/utils/maps.utils';
import {
  Pet,
  User,
  SPECIES_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  FUR_LENGTH_LABEL,
  PET_STATUS_LABEL,
} from '../../../src/types';

// Tela de detalhes do pet — exibe todas as informações + ações (WhatsApp, Maps, Adoção)
export default function PetDetailScreen() {
  // petId vem da rota dinâmica /catalog/[petId]
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { user } = useAuthStore();
  const [pet, setPet] = useState<Pet | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função de carregamento extraída para poder ser chamada no retry
  async function loadData() {
    if (!petId) return;
    setLoading(true);
    setError(null);
    try {
      // Busca o pet pelo ID
      const petData = await getPetById(petId);
      setPet(petData);

      // Busca o perfil do doador para exibir telefone (WhatsApp)
      const ownerSnap = await getDoc(doc(db, 'users', petData.ownerId));
      if (ownerSnap.exists()) {
        setOwner(ownerSnap.data() as User);
      }
    } catch {
      setError('Não foi possível carregar os dados do pet.');
    } finally {
      setLoading(false);
    }
  }

  // Carrega dados do pet e do doador ao montar a tela
  useEffect(() => {
    loadData();
  }, [petId]);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error || !pet) {
    return <ErrorMessage message={error ?? 'Pet não encontrado.'} onRetry={loadData} />;
  }

  // RN03: Verifica se o usuário logado é o dono do pet
  const isOwner = user?.uid === pet.ownerId;
  const isAvailable = pet.status === 'available';

  // Formata a idade para exibição (meses ou anos)
  const ageText =
    pet.ageMonths < 12
      ? `${pet.ageMonths} ${pet.ageMonths === 1 ? 'mês' : 'meses'}`
      : `${Math.floor(pet.ageMonths / 12)} ${Math.floor(pet.ageMonths / 12) === 1 ? 'ano' : 'anos'}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Foto principal do pet (Cloudinary) */}
      <Image source={{ uri: pet.photoUrl }} style={styles.photo} />

      {/* Nome e badge de status */}
      <View style={styles.header}>
        <Text style={styles.name}>{pet.name}</Text>
        <View style={[styles.statusBadge, !isAvailable && styles.statusUnavailable]}>
          <Text style={styles.statusText}>{PET_STATUS_LABEL[pet.status]}</Text>
        </View>
      </View>

      <Text style={styles.description}>{pet.description}</Text>

      {/* Características detalhadas do pet (labels em PT-BR) */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Características</Text>
        <InfoRow label="Espécie" value={SPECIES_LABEL[pet.species]} />
        <InfoRow label="Sexo" value={SEX_LABEL[pet.sex]} />
        <InfoRow label="Idade" value={ageText} />
        <InfoRow label="Porte" value={SIZE_LABEL[pet.size]} />
        <InfoRow label="Tamanho dos pelos" value={FUR_LENGTH_LABEL[pet.furLength]} />
        {pet.furColor && <InfoRow label="Cor dos pelos" value={pet.furColor} />}
        <InfoRow label="Cor dos olhos" value={pet.eyeColor} />
        <InfoRow label="Castrado" value={pet.neutered ? 'Sim' : 'Não'} />
      </View>

      {/* Endereço do ponto de encontro */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Ponto de encontro</Text>
        <Text style={styles.address}>{pet.meetingLocation.formattedAddress}</Text>
      </View>

      {/* Botões de ação — visíveis apenas se o pet está disponível */}
      {isAvailable && (
        <View style={styles.actions}>
          {/* Botão WhatsApp: abre conversa com o doador */}
          {owner && (
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => openWhatsApp(owner.phone)}
            >
              <Text style={styles.buttonText}>Contato via WhatsApp</Text>
            </TouchableOpacity>
          )}

          {/* Botão Maps: abre o Google Maps com o endereço do ponto de encontro */}
          <TouchableOpacity
            style={styles.mapsButton}
            onPress={() => openGoogleMaps(pet.meetingLocation.formattedAddress)}
          >
            <Text style={styles.buttonText}>Ver no Maps</Text>
          </TouchableOpacity>

          {/* RN03: Botão de adoção oculto se o pet é do próprio usuário */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.adoptButton}
              onPress={() => {
                if (!user) return;
                // Confirmação antes de solicitar a adoção
                Alert.alert('Solicitar adoção', `Deseja solicitar a adoção de ${pet.name}?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Solicitar',
                    onPress: async () => {
                      try {
                        await requestAdoption(pet.id, user.uid);
                        Alert.alert('Sucesso', 'Solicitação de adoção enviada!');
                        // Recarrega o pet para atualizar o status na tela
                        const updated = await getPetById(pet.id);
                        setPet(updated);
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Erro ao solicitar adoção.';
                        Alert.alert('Erro', msg);
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.buttonText}>Solicitar Adoção</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// Componente de linha de informação (label: valor)
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  photo: {
    width: '100%',
    height: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#38a169',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusUnavailable: {
    backgroundColor: '#d69e2e',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mapsButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adoptButton: {
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
