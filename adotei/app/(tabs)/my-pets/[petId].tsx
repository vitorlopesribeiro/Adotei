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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { petSchema, PetFormValues } from '../../../src/schemas/pet.schema';
import { getPetById, updatePet } from '../../../src/services/pets.service';
import { useAuthStore } from '../../../src/stores/auth.store';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import {
  Pet,
  SPECIES_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  FUR_LENGTH_LABEL,
  PetSpecies,
  PetSex,
  PetSize,
  FurLength,
} from '../../../src/types';

// Tela de edição de pet — reutiliza o formulário de cadastro preenchido com dados atuais
export default function EditPetScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  // Nova imagem selecionada (null = mantém a foto atual)
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
  });

  // Carrega os dados atuais do pet e preenche o formulário
  async function loadPet() {
    if (!petId) return;
    setLoading(true);
    setError(null);
    try {
      const petData = await getPetById(petId);
      setPet(petData);
      // Preenche o formulário com os dados atuais do pet
      reset({
        name: petData.name,
        species: petData.species,
        ageMonths: petData.ageMonths,
        sex: petData.sex,
        size: petData.size,
        furColor: petData.furColor,
        furLength: petData.furLength,
        eyeColor: petData.eyeColor,
        neutered: petData.neutered,
        description: petData.description,
        meetingLocation: {
          street: petData.meetingLocation.street,
          number: petData.meetingLocation.number,
          complement: petData.meetingLocation.complement ?? '',
          neighborhood: petData.meetingLocation.neighborhood,
          city: petData.meetingLocation.city,
          state: petData.meetingLocation.state,
          zipCode: petData.meetingLocation.zipCode,
        },
      });
    } catch {
      setError('Não foi possível carregar os dados do pet.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPet();
  }, [petId]);

  // Abre a galeria para selecionar nova foto
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
    }
  }

  // Salva as alterações no Firestore (e foto no Cloudinary se alterada)
  async function onSubmit(data: PetFormValues) {
    if (!petId || !user) return;

    setSaving(true);
    try {
      await updatePet(petId, data, newImageUri ?? undefined);
      Alert.alert('Sucesso', 'Pet atualizado com sucesso.');
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar pet.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error || !pet) {
    return <ErrorMessage message={error ?? 'Pet não encontrado.'} onRetry={loadPet} />;
  }

  // URL da foto a exibir: nova selecionada ou atual do Cloudinary
  const displayPhoto = newImageUri ?? pet.photoUrl;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Editar pet</Text>

      {/* Foto com opção de trocar */}
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoButtonText}>+ Adicionar foto</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.photoHint}>Toque na foto para alterar</Text>

      <Field label="Nome" error={errors.name?.message}>
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Nome do pet" />
        )} />
      </Field>

      <Field label="Espécie" error={errors.species?.message}>
        <Controller control={control} name="species" render={({ field: { onChange, value } }) => (
          <OptionGroup options={Object.entries(SPECIES_LABEL) as [PetSpecies, string][]} value={value} onChange={onChange} />
        )} />
      </Field>

      <Field label="Sexo" error={errors.sex?.message}>
        <Controller control={control} name="sex" render={({ field: { onChange, value } }) => (
          <OptionGroup options={Object.entries(SEX_LABEL) as [PetSex, string][]} value={value} onChange={onChange} />
        )} />
      </Field>

      <Field label="Porte" error={errors.size?.message}>
        <Controller control={control} name="size" render={({ field: { onChange, value } }) => (
          <OptionGroup options={Object.entries(SIZE_LABEL) as [PetSize, string][]} value={value} onChange={onChange} />
        )} />
      </Field>

      <Field label="Tamanho dos pelos" error={errors.furLength?.message}>
        <Controller control={control} name="furLength" render={({ field: { onChange, value } }) => (
          <OptionGroup options={Object.entries(FUR_LENGTH_LABEL) as [FurLength, string][]} value={value} onChange={onChange} />
        )} />
      </Field>

      <Field label="Cor dos pelos (deixe vazio se sem pelo)" error={errors.furColor?.message}>
        <Controller control={control} name="furColor" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={(text) => onChange(text || null)} value={value ?? ''} placeholder="Ex: Caramelo" />
        )} />
      </Field>

      <Field label="Cor dos olhos" error={errors.eyeColor?.message}>
        <Controller control={control} name="eyeColor" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Ex: Castanho" />
        )} />
      </Field>

      <Field label="Idade (em meses)" error={errors.ageMonths?.message}>
        <Controller control={control} name="ageMonths" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={(text) => onChange(Number(text))} value={value !== undefined ? String(value) : ''} placeholder="Ex: 18" keyboardType="numeric" />
        )} />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Castrado</Text>
        <Controller control={control} name="neutered" render={({ field: { onChange, value } }) => (
          <Switch value={value} onValueChange={onChange} trackColor={{ true: '#E87722' }} />
        )} />
      </View>

      <Field label="Descrição" error={errors.description?.message}>
        <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, styles.textarea]} onChangeText={onChange} value={value} placeholder="Conte um pouco sobre o pet..." multiline numberOfLines={4} />
        )} />
      </Field>

      {/* Ponto de encontro */}
      <Text style={styles.sectionTitle}>Ponto de encontro</Text>

      <Field label="Rua" error={errors.meetingLocation?.street?.message}>
        <Controller control={control} name="meetingLocation.street" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Rua das Flores" />
        )} />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Número" error={errors.meetingLocation?.number?.message}>
            <Controller control={control} name="meetingLocation.number" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="142" />
            )} />
          </Field>
        </View>
        <View style={{ flex: 2 }}>
          <Field label="Complemento" error={undefined}>
            <Controller control={control} name="meetingLocation.complement" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Opcional" />
            )} />
          </Field>
        </View>
      </View>

      <Field label="Bairro" error={errors.meetingLocation?.neighborhood?.message}>
        <Controller control={control} name="meetingLocation.neighborhood" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Vila Madalena" />
        )} />
      </Field>

      <Field label="Cidade" error={errors.meetingLocation?.city?.message}>
        <Controller control={control} name="meetingLocation.city" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="São Paulo" />
        )} />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Estado" error={errors.meetingLocation?.state?.message}>
            <Controller control={control} name="meetingLocation.state" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="SP" maxLength={2} autoCapitalize="characters" />
            )} />
          </Field>
        </View>
        <View style={{ flex: 2 }}>
          <Field label="CEP (8 dígitos)" error={errors.meetingLocation?.zipCode?.message}>
            <Controller control={control} name="meetingLocation.zipCode" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="01310100" keyboardType="numeric" maxLength={8} />
            )} />
          </Field>
        </View>
      </View>

      {/* Botões: Salvar e Cancelar */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function OptionGroup<T extends string>({ options, value, onChange }: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map(([key, label]) => (
        <TouchableOpacity key={key} style={[styles.option, value === key && styles.optionSelected]} onPress={() => onChange(key)}>
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
    marginBottom: 4,
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
  photoHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
