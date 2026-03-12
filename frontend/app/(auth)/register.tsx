import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

// Importando as regras de validação e a função de cadastro
import { userSchema, type UserFormData } from '@/src/schemas/user.schema'; 
import { registerUser } from '../../src/services/auth.service';

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Configuração do formulário com TODOS os campos que o Service exige
  const { control, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '', email: '', password: '', cpf: '', phone: '',
      address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' }
    }
  });

  // Função disparada se todos os campos estiverem preenchidos corretamente
  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      await registerUser(data);
      Alert.alert('Sucesso!', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  // Se o botão não funcionar, ela avisa qual campo está errado no console
  const onError = (errors: any) => {
    console.log("Campos inválidos:", errors);
    Alert.alert("Erro de Validação", "Preencha todos os campos obrigatórios, incluindo o endereço.");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>🐾 Cadastro Adotei</Text>

        {/* --- DADOS PESSOAIS --- */}
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        
        <Text style={styles.label}>Nome Completo</Text>
        <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Ex: Maria Silva" value={value || ''} onChangeText={onChange} />
        )} />

        <Text style={styles.label}>CPF (Apenas números)</Text>
        <Controller control={control} name="cpf" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="00000000000" value={value || ''} onChangeText={onChange} keyboardType="numeric" maxLength={11} />
        )} />

        <Text style={styles.label}>E-mail</Text>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="seu@email.com" value={value || ''} onChangeText={onChange} autoCapitalize="none" />
        )} />

        <Text style={styles.label}>Senha</Text>
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="******" value={value || ''} onChangeText={onChange} secureTextEntry />
        )} />

        <Text style={styles.sectionTitle}>Endereço</Text>

        <Text style={styles.label}>CEP</Text>
        <Controller control={control} name="address.zipCode" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="00000000" value={value || ''} onChangeText={onChange} keyboardType="numeric" />
        )} />

        <Text style={styles.label}>Rua</Text>
        <Controller control={control} name="address.street" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Nome da rua" value={value || ''} onChangeText={onChange} />
        )} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '30%' }}>
            <Text style={styles.label}>Nº</Text>
            <Controller control={control} name="address.number" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="123" value={value || ''} onChangeText={onChange} />
            )} />
          </View>
          <View style={{ width: '65%' }}>
            <Text style={styles.label}>Bairro</Text>
            <Controller control={control} name="address.neighborhood" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="Bairro" value={value || ''} onChangeText={onChange} />
            )} />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit(onSubmit, onError)} // Agora o onError vai te avisar se algo falhar
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, backgroundColor: '#FFF' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#E87722', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#E87722', marginTop: 25, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  label: { fontSize: 13, color: '#666', marginTop: 15, fontWeight: '600' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', padding: 8, fontSize: 15 },
  button: { backgroundColor: '#E87722', padding: 16, borderRadius: 10, marginTop: 40, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});