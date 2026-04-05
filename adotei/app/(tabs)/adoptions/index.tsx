import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import { useAuthStore } from '../../../src/stores/auth.store';
import {
  getSentAdoptions,
  getReceivedAdoptions,
  confirmAdoption,
  rejectAdoption,
} from '../../../src/services/adoptions.service';
import { Adoption, Pet, User, ADOPTION_STATUS_LABEL, AdoptionStatus } from '../../../src/types';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';

type Tab = 'sent' | 'received';

// Tipo estendido com dados adicionais do pet e do outro usuário para exibição
interface AdoptionWithDetails extends Adoption {
  petName: string;
  otherUserName: string;
  otherUserPhone: string;
}

// Cores dos badges de status das adoções
const STATUS_COLORS: Record<AdoptionStatus, string> = {
  pending: '#d69e2e',    // Amarelo
  confirmed: '#38a169',  // Verde
  rejected: '#e53e3e',   // Vermelho
};

// Tela de adoções — abas "Enviados" (solicitações feitas) e "Recebidos" (solicitações recebidas)
export default function AdoptionsScreen() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('sent');
  const [sentItems, setSentItems] = useState<AdoptionWithDetails[]>([]);
  const [receivedItems, setReceivedItems] = useState<AdoptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Carrega todas as adoções (enviadas + recebidas) e enriquece com dados do pet e usuário
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Busca em paralelo as adoções enviadas e recebidas
      const [sent, received] = await Promise.all([
        getSentAdoptions(user.uid),
        getReceivedAdoptions(user.uid),
      ]);

      // Enriquece cada adoção com nome do pet e dados do outro usuário
      const enriched = await Promise.all(
        [...sent, ...received].map(async (adoption) => {
          const [petSnap, otherSnap] = await Promise.all([
            getDoc(doc(db, 'pets', adoption.petId)),
            // Busca o "outro" usuário: se eu sou adotante, busca o doador e vice-versa
            getDoc(
              doc(
                db,
                'users',
                adoption.adopterId === user.uid ? adoption.donorId : adoption.adopterId
              )
            ),
          ]);
          const pet = petSnap.exists() ? (petSnap.data() as Pet) : null;
          const otherUser = otherSnap.exists() ? (otherSnap.data() as User) : null;

          return {
            ...adoption,
            petName: pet?.name ?? 'Pet removido',
            otherUserName: otherUser?.fullName ?? 'Usuário desconhecido',
            otherUserPhone: otherUser?.phone ?? '',
          } as AdoptionWithDetails;
        })
      );

      // Separa em enviados e recebidos para as respectivas abas
      setSentItems(enriched.filter((a) => a.adopterId === user.uid));
      setReceivedItems(enriched.filter((a) => a.donorId === user.uid));
    } catch {
      setError('Não foi possível carregar as adoções. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Recarrega ao ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // RN01: Confirma a adoção (muda pet para "adopted" + envia e-mail)
  async function handleConfirm(adoptionId: string) {
    Alert.alert('Confirmar adoção', 'Tem certeza que deseja confirmar esta adoção?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setActionLoading(adoptionId);
          try {
            await confirmAdoption(adoptionId);
            Alert.alert('Sucesso', 'Adoção confirmada! E-mail enviado para ambas as partes.');
            await loadData();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Erro ao confirmar adoção.';
            Alert.alert('Erro', msg);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  // RN01: Recusa a adoção (pet volta para "available")
  async function handleReject(adoptionId: string) {
    Alert.alert('Recusar adoção', 'Tem certeza que deseja recusar esta solicitação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(adoptionId);
          try {
            await rejectAdoption(adoptionId);
            Alert.alert('Sucesso', 'Solicitação recusada. O pet voltou a ficar disponível.');
            await loadData();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Erro ao recusar adoção.';
            Alert.alert('Erro', msg);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  const data = tab === 'sent' ? sentItems : receivedItems;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adoções</Text>

      {/* Seletor de abas: Enviados / Recebidos */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'sent' && styles.tabActive]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>Enviados</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'received' && styles.tabActive]}
          onPress={() => setTab('received')}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>
            Recebidos
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : data.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {tab === 'sent'
              ? 'Você ainda não solicitou nenhuma adoção'
              : 'Nenhuma solicitação recebida'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Header do card: nome do pet + badge de status */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardPetName}>{item.petName}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                  <Text style={styles.badgeText}>{ADOPTION_STATUS_LABEL[item.status]}</Text>
                </View>
              </View>

              {/* Dados do outro usuário (doador ou adotante) */}
              <Text style={styles.cardInfo}>
                {tab === 'sent' ? 'Doador' : 'Adotante'}: {item.otherUserName}
              </Text>
              {/* Telefone visível apenas na aba "Recebidos" (para o doador contatar o adotante) */}
              {tab === 'received' && item.otherUserPhone && (
                <Text style={styles.cardInfo}>Telefone: {item.otherUserPhone}</Text>
              )}
              {item.requestedAt && (
                <Text style={styles.cardDate}>
                  Solicitado em:{' '}
                  {item.requestedAt.toDate
                    ? item.requestedAt.toDate().toLocaleDateString('pt-BR')
                    : ''}
                </Text>
              )}

              {/* RN01: Botões de ação visíveis apenas na aba "Recebidos" e para pedidos pendentes */}
              {tab === 'received' && item.status === 'pending' && (
                <View style={styles.actions}>
                  {actionLoading === item.id ? (
                    <ActivityIndicator color="#E87722" />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirm(item.id)}
                      >
                        <Text style={styles.actionButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(item.id)}
                      >
                        <Text style={styles.actionButtonText}>Recusar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: '#E87722',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#38a169',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
