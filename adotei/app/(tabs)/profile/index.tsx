import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import { useAuthStore } from '../../../src/stores/auth.store';
import { logoutUser } from '../../../src/services/auth.service';
import { User } from '../../../src/types';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as User);
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar perfil:', error);
      })
      .finally(() => setLoading(false));
  }, [user]);

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
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E87722" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil</Text>

      {profile && (
        <>
          <View style={styles.section}>
            <InfoRow label="Nome" value={profile.fullName} />
            <InfoRow label="E-mail" value={profile.email} />
            <InfoRow label="Telefone" value={profile.phone} />
          </View>

          <Text style={styles.sectionTitle}>Endereço</Text>
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
        </>
      )}

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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
