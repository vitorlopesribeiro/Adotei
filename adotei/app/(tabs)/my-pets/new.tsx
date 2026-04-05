import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { petSchema, PetFormValues } from '../../../src/schemas/pet.schema';
import { createPet } from '../../../src/services/pets.service';
import { useAuthStore } from '../../../src/stores/auth.store';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { User } from '../../../src/types';
import {
  SPECIES_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  FUR_LENGTH_LABEL,
  PetSpecies,
  PetSex,
  PetSize,
  FurLength,
} from '../../../src/types';

// Tela de cadastro de pet — formulário completo com foto, dados e localização
export default function NewPetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hasCpf, setHasCpf] = useState(true);
  const [checkingCpf, setCheckingCpf] = useState(true);

  // RN06: Verifica se o usuário tem CPF válido cadastrado antes de permitir publicar pets
  useEffect(() => {
    if (!user) return;
    setCheckingCpf(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const profile = snap.data() as User;
          // CPF é armazenado criptografado — se existir e não estiver vazio, é válido
          setHasCpf(!!profile.cpf);
        } else {
          setHasCpf(false);
        }
      })
      .catch(() => setHasCpf(false))
      .finally(() => setCheckingCpf(false));
  }, [user]);

  // React Hook Form com validação Zod (petSchema)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      neutered: false,
      furColor: null,
      meetingLocation: {},
    },
  });

  // Abre a galeria do dispositivo para selecionar foto do pet
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],    // Crop quadrado para uniformidade no catálogo
      quality: 0.8,       // Comprime para reduzir tamanho do upload
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  // Submete o formulário: cria o pet no Firestore + upload da foto no Cloudinary
  async function onSubmit(data: PetFormValues) {
    if (!imageUri) {
      Alert.alert('Foto obrigatória', 'Selecione uma foto do pet.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await createPet(data, imageUri, user.uid);
      // Após sucesso, redireciona para a lista "Meus Pets"
      router.replace('/(tabs)/my-pets');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao cadastrar pet.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  // Loading enquanto verifica CPF
  if (checkingCpf) {
    return <LoadingOverlay />;
  }

  // RN06: Bloqueia cadastro de pet se usuário não tem CPF válido
  if (!hasCpf) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 }}>
          CPF obrigatório
        </Text>
        <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
          Você precisa ter um CPF válido cadastrado no seu perfil para publicar pets.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Cadastrar pet</Text>

      {/* Seletor de foto com preview */}
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoButtonText}>+ Adicionar foto</Text>
        )}
      </TouchableOpacity>

      {/* Nome do pet */}
      <Field label="Nome" error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Nome do pet" />
          )}
        />
      </Field>

      {/* Seletores de características com botões de opção */}
      <Field label="Espécie" error={errors.species?.message}>
        <Controller
          control={control}
          name="species"
          render={({ field: { onChange, value } }) => (
            <OptionGroup
              options={Object.entries(SPECIES_LABEL) as [PetSpecies, string][]}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Field>

      <Field label="Sexo" error={errors.sex?.message}>
        <Controller
          control={control}
          name="sex"
          render={({ field: { onChange, value } }) => (
            <OptionGroup
              options={Object.entries(SEX_LABEL) as [PetSex, string][]}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Field>

      <Field label="Porte" error={errors.size?.message}>
        <Controller
          control={control}
          name="size"
          render={({ field: { onChange, value } }) => (
            <OptionGroup
              options={Object.entries(SIZE_LABEL) as [PetSize, string][]}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Field>

      <Field label="Tamanho dos pelos" error={errors.furLength?.message}>
        <Controller
          control={control}
          name="furLength"
          render={({ field: { onChange, value } }) => (
            <OptionGroup
              options={Object.entries(FUR_LENGTH_LABEL) as [FurLength, string][]}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Field>

      {/* Cor dos pelos: campo de texto, nullable para pets sem pelo */}
      <Field label="Cor dos pelos (deixe vazio se sem pelo)" error={errors.furColor?.message}>
        <Controller
          control={control}
          name="furColor"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={(text) => onChange(text || null)}
              value={value ?? ''}
              placeholder="Ex: Caramelo"
            />
          )}
        />
      </Field>

      <Field label="Cor dos olhos" error={errors.eyeColor?.message}>
        <Controller
          control={control}
          name="eyeColor"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Ex: Castanho" />
          )}
        />
      </Field>

      {/* Idade em meses (converte texto para número) */}
      <Field label="Idade (em meses)" error={errors.ageMonths?.message}>
        <Controller
          control={control}
          name="ageMonths"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={(text) => onChange(Number(text))}
              value={value !== undefined ? String(value) : ''}
              placeholder="Ex: 18"
              keyboardType="numeric"
            />
          )}
        />
      </Field>

      {/* Toggle de castrado */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Castrado</Text>
        <Controller
          control={control}
          name="neutered"
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onValueChange={onChange} trackColor={{ true: '#E87722' }} />
          )}
        />
      </View>

      <Field label="Descrição" error={errors.description?.message}>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textarea]}
              onChangeText={onChange}
              value={value}
              placeholder="Conte um pouco sobre o pet..."
              multiline
              numberOfLines={4}
            />
          )}
        />
      </Field>

      {/* Seção de ponto de encontro (RN07: pode ser diferente do endereço pessoal) */}
      <Text style={styles.sectionTitle}>Ponto de encontro</Text>

      <Field label="Rua" error={errors.meetingLocation?.street?.message}>
        <Controller
          control={control}
          name="meetingLocation.street"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Rua das Flores" />
          )}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Número" error={errors.meetingLocation?.number?.message}>
            <Controller
              control={control}
              name="meetingLocation.number"
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
              name="meetingLocation.complement"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Opcional" />
              )}
            />
          </Field>
        </View>
      </View>

      <Field label="Bairro" error={errors.meetingLocation?.neighborhood?.message}>
        <Controller
          control={control}
          name="meetingLocation.neighborhood"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Vila Madalena" />
          )}
        />
      </Field>

      <Field label="Cidade" error={errors.meetingLocation?.city?.message}>
        <Controller
          control={control}
          name="meetingLocation.city"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="São Paulo" />
          )}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Estado" error={errors.meetingLocation?.state?.message}>
            <Controller
              control={control}
              name="meetingLocation.state"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="SP" maxLength={2} autoCapitalize="characters" />
              )}
            />
          </Field>
        </View>
        <View style={{ flex: 2 }}>
          <Field label="CEP (8 dígitos)" error={errors.meetingLocation?.zipCode?.message}>
            <Controller
              control={control}
              name="meetingLocation.zipCode"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="01310100" keyboardType="numeric" maxLength={8} />
              )}
            />
          </Field>
        </View>
      </View>

      {/* Botão de submit com loading */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar pet</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Componente auxiliar para campo de formulário com label e erro
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// Componente genérico de seleção por botões (similar ao catálogo, mas sem toggle)
function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={[styles.option, value === key && styles.optionSelected]}
          onPress={() => onChange(key)}
        >
          <Text style={[styles.optionText, value === key && styles.optionTextSelected]}>{label}</Text>
        </TouchableOpacity>
      ))}
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
    marginBottom: 20,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
    color: '#444',
  },
  photoButton: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoButtonText: {
    color: '#999',
    fontSize: 16,
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
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  optionSelected: {
    borderColor: '#E87722',
    backgroundColor: '#FFF3EC',
  },
  optionText: {
    fontSize: 13,
    color: '#555',
  },
  optionTextSelected: {
    color: '#E87722',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
