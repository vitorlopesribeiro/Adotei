import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPets } from '../../../src/services/pets.service';
import { useFiltersStore } from '../../../src/stores/filters.store';
import { LoadingOverlay } from '../../../src/components/ui/LoadingOverlay';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import {
  Pet,
  PetFilters,
  PetSpecies,
  PetSex,
  PetSize,
  FurLength,
  SPECIES_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  FUR_LENGTH_LABEL,
} from '../../../src/types';

// Cálculos para grid de 2 colunas responsivo
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 20;
const NUM_COLUMNS = 2;
const CARD_WIDTH =
  (Dimensions.get('window').width - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS;

// Tela do catálogo — lista todos os pets disponíveis em grade com filtros
export default function CatalogScreen() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const { filters, activeCount } = useFiltersStore();

  const count = activeCount();

  // Função de busca extraída para poder ser chamada no retry
  const fetchPets = useCallback(() => {
    setLoading(true);
    setError(null);
    // Monta objeto de filtros removendo valores undefined/vazios
    const cleanFilters: PetFilters = {};
    if (filters.species) cleanFilters.species = filters.species;
    if (filters.sex) cleanFilters.sex = filters.sex;
    if (filters.size) cleanFilters.size = filters.size;
    if (filters.furLength) cleanFilters.furLength = filters.furLength;
    if (filters.neutered !== undefined) cleanFilters.neutered = filters.neutered;
    if (filters.city) cleanFilters.city = filters.city;
    if (filters.neighborhood) cleanFilters.neighborhood = filters.neighborhood;

    // Busca pets no Firestore com os filtros aplicados
    getPets(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined)
      .then((data) => setPets(data))
      .catch(() => setError('Não foi possível carregar os pets. Verifique sua conexão.'))
      .finally(() => setLoading(false));
  }, [filters]);

  // Recarrega os pets toda vez que a tela ganha foco ou os filtros mudam
  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [fetchPets])
  );

  return (
    <View style={styles.container}>
      {/* Header com título e botão de filtros (exibe contador de filtros ativos) */}
      <View style={styles.header}>
        <Text style={styles.title}>Catálogo</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            Filtros{count > 0 ? ` (${count})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPets} />
      ) : pets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhum pet disponível no momento</Text>
        </View>
      ) : (
        // Grade de 2 colunas com cards de pets
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/catalog/${item.id}`)}
            >
              <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardInfo}>{SPECIES_LABEL[item.species]}</Text>
                {/* Formata idade: meses se < 12, anos caso contrário */}
                <Text style={styles.cardInfo}>
                  {item.ageMonths < 12
                    ? `${item.ageMonths} ${item.ageMonths === 1 ? 'mês' : 'meses'}`
                    : `${Math.floor(item.ageMonths / 12)} ${Math.floor(item.ageMonths / 12) === 1 ? 'ano' : 'anos'}`}
                  {' \u00B7 '}
                  {SIZE_LABEL[item.size]}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de filtros */}
      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </View>
  );
}

// Modal com todos os filtros disponíveis para o catálogo
function FilterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { filters, setFilter, clearFilters } = useFiltersStore();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro por espécie (Cão/Gato) */}
        <Text style={styles.filterLabel}>Espécie</Text>
        <OptionRow
          options={Object.entries(SPECIES_LABEL) as [PetSpecies, string][]}
          value={filters.species}
          onChange={(v) => setFilter('species', filters.species === v ? undefined : v)}
        />

        {/* Filtro por sexo (Macho/Fêmea) */}
        <Text style={styles.filterLabel}>Sexo</Text>
        <OptionRow
          options={Object.entries(SEX_LABEL) as [PetSex, string][]}
          value={filters.sex}
          onChange={(v) => setFilter('sex', filters.sex === v ? undefined : v)}
        />

        {/* Filtro por porte (Pequeno/Médio/Grande) */}
        <Text style={styles.filterLabel}>Porte</Text>
        <OptionRow
          options={Object.entries(SIZE_LABEL) as [PetSize, string][]}
          value={filters.size}
          onChange={(v) => setFilter('size', filters.size === v ? undefined : v)}
        />

        {/* Filtro por tamanho dos pelos */}
        <Text style={styles.filterLabel}>Tamanho dos pelos</Text>
        <OptionRow
          options={Object.entries(FUR_LENGTH_LABEL) as [FurLength, string][]}
          value={filters.furLength}
          onChange={(v) => setFilter('furLength', filters.furLength === v ? undefined : v)}
        />

        {/* Toggle para filtrar apenas castrados */}
        <View style={styles.switchRow}>
          <Text style={styles.filterLabel}>Apenas castrados</Text>
          <Switch
            value={filters.neutered === true}
            onValueChange={(v) => setFilter('neutered', v ? true : undefined)}
            trackColor={{ true: '#E87722' }}
          />
        </View>

        {/* Filtros de localização (texto livre) */}
        <Text style={styles.filterLabel}>Cidade</Text>
        <TextInput
          style={styles.textInput}
          value={filters.city ?? ''}
          onChangeText={(v) => setFilter('city', v || undefined)}
          placeholder="Ex: São Paulo"
        />

        <Text style={styles.filterLabel}>Bairro</Text>
        <TextInput
          style={styles.textInput}
          value={filters.neighborhood ?? ''}
          onChangeText={(v) => setFilter('neighborhood', v || undefined)}
          placeholder="Ex: Vila Madalena"
        />

        {/* Ações: limpar filtros ou aplicar */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => { clearFilters(); onClose(); }}
          >
            <Text style={styles.clearButtonText}>Limpar filtros</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

// Componente genérico de seleção por botões (toggle — toque de novo desmarca)
function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T | undefined;
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
          <Text style={[styles.optionText, value === key && styles.optionTextSelected]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  list: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH,
  },
  cardContent: {
    padding: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  cardInfo: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeText: {
    fontSize: 15,
    color: '#E87722',
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#E87722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
