import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

export interface MatchmakingFilters {
  maxBudget?: number;
  hobbies?: string[];
  musicGenres?: string[];
  smokingPreference?: string;
  cleaningFrequency?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: MatchmakingFilters) => void;
}

const HOBBIES_OPTIONS = ['Cocina', 'Gaming', 'Ejercicio', 'Fotografía', 'Lectura', 'Viajar', 'Yoga', 'Arte', 'Senderismo'];
const MUSIC_OPTIONS = ['Rap', 'Rock', 'Electronic', 'Reggaeton', 'Indie', 'Salsa', 'K-Pop', 'Jazz', 'Clásica'];

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [budget, setBudget] = useState<number>(200);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [smoking, setSmoking] = useState<string>('');
  const [cleaning, setCleaning] = useState<string>('');

  const toggleSelection = (item: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  const handleApply = () => {
    onApply({
      maxBudget: budget,
      hobbies,
      musicGenres,
      smokingPreference: smoking,
      cleaningFrequency: cleaning,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros de Búsqueda</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Presupuesto Máximo: ${budget}</Text>
              <View style={styles.sliderMock}>
                {/* Fallback to simple buttons instead of slider for compatibility without external slider library */}
                <TouchableOpacity onPress={() => setBudget(Math.max(150, budget - 10))} style={styles.budgetBtn}><Text>-</Text></TouchableOpacity>
                <Text style={styles.budgetValue}>${budget}</Text>
                <TouchableOpacity onPress={() => setBudget(Math.min(300, budget + 10))} style={styles.budgetBtn}><Text>+</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tabaco / Vape</Text>
              <View style={styles.chipRow}>
                {['fumo', 'no-fumo', 'no-tolero'].map(opt => (
                  <TouchableOpacity key={opt} style={[styles.chip, smoking === opt && styles.chipActive]} onPress={() => setSmoking(opt)}>
                    <Text style={[styles.chipText, smoking === opt && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Limpieza</Text>
              <View style={styles.chipRow}>
                {['diaria', '2-3 veces', 'semanal'].map(opt => (
                  <TouchableOpacity key={opt} style={[styles.chip, cleaning === opt && styles.chipActive]} onPress={() => setCleaning(opt)}>
                    <Text style={[styles.chipText, cleaning === opt && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hobbies</Text>
              <View style={styles.chipRow}>
                {HOBBIES_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} style={[styles.chip, hobbies.includes(opt) && styles.chipActive]} onPress={() => toggleSelection(opt, hobbies, setHobbies)}>
                    <Text style={[styles.chipText, hobbies.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Música</Text>
              <View style={styles.chipRow}>
                {MUSIC_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} style={[styles.chip, musicGenres.includes(opt) && styles.chipActive]} onPress={() => toggleSelection(opt, musicGenres, setMusicGenres)}>
                    <Text style={[styles.chipText, musicGenres.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8C3A27',
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 12,
  },
  sliderMock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  budgetBtn: {
    backgroundColor: '#eee',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#8C3A27',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyBtn: {
    backgroundColor: '#8C3A27',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
