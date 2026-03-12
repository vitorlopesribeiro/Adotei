import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';

// MUDANÇA: Importando a função específica entre chaves
import { loginUser } from '../../src/services/auth.service';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Chamando a função diretamente sem o "authService."
      await loginUser(data.email, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.code === 'auth/invalid-credential' 
        ? 'E-mail ou senha incorretos.' 
        : 'Erro ao conectar com o servidor.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🐾 Adotei</Text>
      
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput 
            style={styles.input} 
            placeholder="E-mail" 
            value={value} 
            onChangeText={onChange} 
            autoCapitalize="none" 
            keyboardType="email-address" 
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput 
            style={styles.input} 
            placeholder="Senha" 
            value={value} 
            onChangeText={onChange} 
            secureTextEntry 
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onLogin)} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>

      <Link href="/(auth)/register" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#FFF' },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#E87722', textAlign: 'center', marginBottom: 40 },
  input: { borderBottomWidth: 1, borderColor: '#DDD', padding: 10, marginBottom: 5, fontSize: 16 },
  button: { backgroundColor: '#E87722', padding: 15, borderRadius: 8, marginTop: 25, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  error: { color: 'red', fontSize: 12, marginBottom: 10 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#E87722', fontWeight: '500' }
});