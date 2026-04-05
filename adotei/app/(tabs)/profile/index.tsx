import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import { useAuthStore } from '../../../src/stores/auth.store';
import { logoutUser, updateUserProfile } from '../../../src/services/auth.service';
import { User, UserAddress } from '../../../src/types';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';

// Tela de perfil — exibe dados do usuário com modo de edição para telefone e endereço
export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Estado do modo de edição
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState<UserAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Função de carregamento do perfil extraída para retry
  function loadProfile() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as User);
        }
      })
      .catch(() => {
        setError('Não foi possível carregar seu perfil. Verifique sua conexão.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Entra no modo de edição preenchendo os campos com os dados atuais
  function startEditing() {
    if (!profile) return;
    setEditPhone(profile.phone);
    setEditAddress({
      street: profile.address.street,
      number: profile.address.number,
      complement: profile.address.complement ?? '',
      neighborhood: profile.address.neighborhood,
      city: profile.address.city,
      state: profile.address.state,
      zipCode: profile.address.zipCode,
    });
    setEditing(true);
  }

  // Cancela a edição e volta ao modo de visualização
  function cancelEditing() {
    setEditing(false);
  }

  // Salva as alterações no Firestore
  async function saveProfile() {
    if (!user || !profile) return;

    // Validações básicas
    if (!editPhone || editPhone.length < 10) {
      Alert.alert('Erro', 'Telefone deve ter DDD + número (mín. 10 dígitos).');
      return;
    }
    if (!editAddress.street || !editAddress.number || !editAddress.neighborhood ||
        !editAddress.city || !editAddress.state || !editAddress.zipCode) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios do endereço.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        phone: editPhone,
        address: editAddress,
      });
      // Atualiza o perfil local com os novos dados
      setProfile({
        ...profile,
        phone: editPhone,
        address: editAddress,
      });
      setEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await logoutUser();
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadProfile} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Perfil</Text>

      {profile && (
        <>
          {/* Dados pessoais (nome e e-mail não editáveis) */}
          <View style={styles.section}>
            <InfoRow label="Nome" value={profile.fullName} />
            <InfoRow label="E-mail" value={profile.email} />
            {/* Telefone: editável no modo de edição */}
            {editing ? (
              <EditRow
                label="Telefone"
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="11987654321"
                keyboardType="numeric"
              />
            ) : (
              <InfoRow label="Telefone" value={profile.phone} />
            )}
          </View>

          {/* Endereço */}
          <Text style={styles.sectionTitle}>Endereço</Text>
          {editing ? (
            // Modo de edição: campos de input
            <View style={styles.editSection}>
              <EditRow label="Rua" value={editAddress.street} onChangeText={(v) => setEditAddress({ ...editAddress, street: v })} placeholder="Rua das Flores" />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <EditRow label="Número" value={editAddress.number} onChangeText={(v) => setEditAddress({ ...editAddress, number: v })} placeholder="142" />
                </View>
                <View style={{ flex: 2 }}>
                  <EditRow label="Complemento" value={editAddress.complement ?? ''} onChangeText={(v) => setEditAddress({ ...editAddress, complement: v })} placeholder="Opcional" />
                </View>
              </View>
              <EditRow label="Bairro" value={editAddress.neighborhood} onChangeText={(v) => setEditAddress({ ...editAddress, neighborhood: v })} placeholder="Vila Madalena" />
              <EditRow label="Cidade" value={editAddress.city} onChangeText={(v) => setEditAddress({ ...editAddress, city: v })} placeholder="São Paulo" />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <EditRow label="Estado" value={editAddress.state} onChangeText={(v) => setEditAddress({ ...editAddress, state: v })} placeholder="SP" maxLength={2} />
                </View>
                <View style={{ flex: 2 }}>
                  <EditRow label="CEP" value={editAddress.zipCode} onChangeText={(v) => setEditAddress({ ...editAddress, zipCode: v })} placeholder="01310100" keyboardType="numeric" maxLength={8} />
                </View>
              </View>
            </View>
          ) : (
            // Modo de visualização
            <View style={styles.section}>
              <InfoRow label="Rua" value={profile.address.street} />
              <InfoRow label="Número" value={profile.address.number} />
              {profile.address.complement && (
                <InfoRow label="Complemento" value={profile.address.complement} />
              )}
              <InfoRow label="Bairro" value={profile.address.neighborhood} />
              <InfoRow label="Cidade" value={profile.address.city} />
              <InfoRow label="Estado" value={profile.address.state} />
              <InfoRow label="CEP" value={profile.address.zipCode} />
            </View>
          )}

          {/* Botões de ação: editar/salvar/cancelar */}
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} disabled={saving}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={startEditing}>
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Botão de logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={logoutLoading}>
        {logoutLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Linha de visualização (somente leitura)
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Linha de edição com input
function EditRow({ label, value, onChangeText, placeholder, keyboardType, maxLength }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  maxLength?: number;
}) {
  return (
    <View style={styles.editRow}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={maxLength === 2 ? 'characters' : 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  editSection: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
  },
  editRow: {
    marginBottom: 8,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#E87722',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
