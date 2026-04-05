import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { getUserPets, deletePet } from '../../../src/services/pets.service';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { Pet, SPECIES_LABEL, PET_STATUS_LABEL, PetStatus } from '../../../src/types';

// Cores dos badges de status para diferenciar visualmente
const STATUS_COLORS: Record<PetStatus, string> = {
  available: '#38a169',  // Verde
  pending: '#d69e2e',    // Amarelo
  adopted: '#3182ce',    // Azul
};

// Tela "Meus Pets" — lista os pets cadastrados pelo usuário logado
export default function MyPetsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Função de busca extraída para poder ser chamada no retry
  const fetchMyPets = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getUserPets(user.uid)
      .then((data) => setPets(data))
      .catch(() => setError('Não foi possível carregar seus pets. Verifique sua conexão.'))
      .finally(() => setLoading(false));
  }, [user]);

  // Recarrega a lista toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchMyPets();
    }, [fetchMyPets])
  );

  // Exclui um pet com confirmação (apenas status "available")
  function handleDelete(pet: Pet) {
    if (!user) return;
    Alert.alert(
      'Excluir pet',
      `Tem certeza que deseja excluir ${pet.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(pet.id);
            try {
              await deletePet(pet.id, user.uid);
              // Remove o pet da lista local sem precisar recarregar
              setPets((prev) => prev.filter((p) => p.id !== pet.id));
              Alert.alert('Sucesso', 'Pet excluído com sucesso.');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erro ao excluir pet.';
              Alert.alert('Erro', msg);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMyPets} />;
  }

  return (
    <View style={styles.container}>
      {/* Header com botão para cadastrar novo pet */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/my-pets/new')}
        >
          <Text style={styles.addButtonText}>+ Cadastrar</Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Você ainda não cadastrou nenhum pet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/my-pets/new')}
          >
            <Text style={styles.emptyButtonText}>Cadastrar meu primeiro pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardInfo}>{SPECIES_LABEL[item.species]}</Text>
                {/* Badge colorido conforme o status do pet */}
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                  <Text style={styles.badgeText}>{PET_STATUS_LABEL[item.status]}</Text>
                </View>

                {/* Botões de editar e excluir — visíveis apenas para pets disponíveis */}
                {item.status === 'available' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => router.push(`/(tabs)/my-pets/${item.id}`)}
                    >
                      <Text style={styles.editButtonText}>Editar informações</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <ActivityIndicator color="#e53e3e" size="small" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Excluir</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#E87722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardImage: {
    width: 100,
    height: 'auto',
    minHeight: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E87722',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#E87722',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#e53e3e',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#e53e3e',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#E87722',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
