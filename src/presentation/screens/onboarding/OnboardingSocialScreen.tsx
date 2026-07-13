import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useOnboarding } from '../../../core/onboarding';
import { onboardingStyles as s } from './onboardingStyles';

const HOBBIES_OPTIONS = ['Cocina', 'Gaming', 'Ejercicio', 'Fotografía', 'Lectura', 'Viajar', 'Yoga', 'Arte', 'Senderismo'];
const MUSIC_OPTIONS = ['Rap', 'Rock', 'Electronic', 'Reggaeton', 'Indie', 'Salsa', 'K-Pop', 'Jazz', 'Clásica'];
const PET_OPTIONS = ['Tengo mascotas', 'No me molestan', 'No tengo mascotas'];
const SMOKING_OPTIONS = ['Me gusta fumar tabaco/vape', 'No fumo dentro del departamento', 'No tolero el humo/vape'];
const SOCIAL_LEVEL_OPTIONS = ['No soy social', 'Sociable dependiendo de que evento hay', 'Soy muy sociable'];

export const OnboardingSocialScreen = ({ navigation }: any) => {
  const { formData, updateFormData } = useOnboarding();
  const { social } = formData;
  const [error, setError] = useState<string | null>(null);

  const toggleHobby = (hobby: string) => {
    const updated = social.hobbies.includes(hobby) ? social.hobbies.filter(h => h !== hobby) : [...social.hobbies, hobby];
    updateFormData({ social: { ...social, hobbies: updated } });
  };

  const toggleMusic = (genre: string) => {
    const updated = social.musicGenres.includes(genre) ? social.musicGenres.filter(g => g !== genre) : [...social.musicGenres, genre];
    updateFormData({ social: { ...social, musicGenres: updated } });
  };

  const handleContinue = () => {
    if (social.hobbies.length === 0) {
      setError('Selecciona al menos un hobby.');
      return;
    }
    if (social.musicGenres.length === 0) {
      setError('Selecciona al menos un género musical.');
      return;
    }
    if (!social.petPreference) {
      setError('Selecciona tu preferencia de mascotas.');
      return;
    }
    if (!social.smokingPreference) {
      setError('Selecciona tu preferencia de humo.');
      return;
    }
    if (!social.socialLevel) {
      setError('Selecciona tu nivel social.');
      return;
    }
    setError(null);
    navigation.navigate('OnboardingFinancial');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.stepLabel}>Paso 3 de 4 · Estilo de vida</Text>
      <Text style={s.title}>Encontrando tu ritmo social</Text>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: '75%' }]} /></View>

      <View style={s.section}>
        <Text style={s.label}>✨ Hobbies</Text>
        <View style={s.optionRow}>
          {HOBBIES_OPTIONS.map(hobby => (
            <TouchableOpacity
              key={hobby}
              style={[s.optionBtn, social.hobbies.includes(hobby) && s.optionBtnActive]}
              onPress={() => toggleHobby(hobby)}
            >
              <Text style={[s.optionText, social.hobbies.includes(hobby) && s.optionTextActive]}>{hobby}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>🎵 Música (puedes elegir varios)</Text>
        <View style={s.optionRow}>
          {MUSIC_OPTIONS.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[s.optionBtn, social.musicGenres.includes(genre) && s.optionBtnActive]}
              onPress={() => toggleMusic(genre)}
            >
              <Text style={[s.optionText, social.musicGenres.includes(genre) && s.optionTextActive]}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>🐾 Mascotas</Text>
        <View style={s.optionRow}>
          {PET_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[s.optionBtn, social.petPreference === option && s.optionBtnActive]}
              onPress={() => updateFormData({ social: { ...social, petPreference: option } })}
            >
              <Text style={[s.optionText, social.petPreference === option && s.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>🚬 Humo y vaper</Text>
        <View style={s.optionRow}>
          {SMOKING_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[s.optionBtn, social.smokingPreference === option && s.optionBtnActive]}
              onPress={() => updateFormData({ social: { ...social, smokingPreference: option } })}
            >
              <Text style={[s.optionText, social.smokingPreference === option && s.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>👥 Nivel social</Text>
        <View style={s.optionRow}>
          {SOCIAL_LEVEL_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[s.optionBtn, social.socialLevel === option && s.optionBtnActive]}
              onPress={() => updateFormData({ social: { ...social, socialLevel: option } })}
            >
              <Text style={[s.optionText, social.socialLevel === option && s.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      <View style={s.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Paso anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue}>
          <Text style={s.continueBtnText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
