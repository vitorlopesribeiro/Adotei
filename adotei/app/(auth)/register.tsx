import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { userSchema, UserFormValues } from '../../src/schemas/user.schema';
import { registerUser } from '../../src/services/auth.service';

// Tela de cadastro — cria conta no Firebase Auth + perfil no Firestore
export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // React Hook Form com validação Zod (userSchema valida CPF, e-mail, etc.)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      address: {},
    },
  });

  // Submete o cadastro e trata erros do Firebase Auth
  async function onSubmit(data: UserFormValues) {
    setLoading(true);
    try {
      await registerUser(data);
      // Após cadastro bem-sucedido, redireciona direto para o catálogo
      router.replace('/(tabs)/catalog');
    } catch (error: unknown) {
      // Trata erro de e-mail já cadastrado no Firebase Auth
      const code = (error as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este e-mail já está cadastrado.');
        return;
      }
      const msg = error instanceof Error ? error.message : 'Não foi possível criar a conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Criar conta</Text>

      {/* Dados pessoais */}
      <Field label="Nome completo" error={errors.fullName?.message}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Seu nome completo" />
          )}
        />
      </Field>

      <Field label="E-mail" error={errors.email?.message}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
          )}
        />
      </Field>

      <Field label="Senha" error={errors.password?.message}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Mínimo 6 caracteres" secureTextEntry />
          )}
        />
      </Field>

      {/* CPF: validado via cpf-cnpj-validator no schema Zod */}
      <Field label="CPF" error={errors.cpf?.message}>
        <Controller
          control={control}
          name="cpf"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="000.000.000-00" keyboardType="numeric" />
          )}
        />
      </Field>

      <Field label="Telefone (com DDD)" error={errors.phone?.message}>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="11987654321" keyboardType="numeric" />
          )}
        />
      </Field>

      {/* Seção de endereço residencial */}
      <Text style={styles.sectionTitle}>Endereço</Text>

      <Field label="Rua" error={errors.address?.street?.message}>
        <Controller
          control={control}
          name="address.street"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Rua das Flores" />
          )}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Número" error={errors.address?.number?.message}>
            <Controller
              control={control}
              name="address.number"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="142" />
              )}
            />
          </Field>
        </View>
        <View style={{ flex: 2 }}>
          <Field label="Complemento" error={undefined}>
            <Controller
              control={control}
              name="address.complement"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Apto 32 (opcional)" />
              )}
            />
          </Field>
        </View>
      </View>

      <Field label="Bairro" error={errors.address?.neighborhood?.message}>
        <Controller
          control={control}
          name="address.neighborhood"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Vila Madalena" />
          )}
        />
      </Field>

      <Field label="Cidade" error={errors.address?.city?.message}>
        <Controller
          control={control}
          name="address.city"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="São Paulo" />
          )}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Estado" error={errors.address?.state?.message}>
            <Controller
              control={control}
              name="address.state"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="SP" maxLength={2} autoCapitalize="characters" />
              )}
            />
          </Field>
        </View>
        <View style={{ flex: 2 }}>
          <Field label="CEP (8 dígitos)" error={errors.address?.zipCode?.message}>
            <Controller
              control={control}
              name="address.zipCode"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="01310100" keyboardType="numeric" maxLength={8} />
              )}
            />
          </Field>
        </View>
      </View>

      {/* Botão de submit com loading */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
      </TouchableOpacity>

      {/* Link para voltar à tela de login */}
      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.link}>
        <Text style={styles.linkText}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Componente auxiliar para campos de formulário com label e mensagem de erro
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
    color: '#444',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
    marginBottom: 40,
  },
  linkText: {
    color: '#E87722',
    fontSize: 14,
  },
});
