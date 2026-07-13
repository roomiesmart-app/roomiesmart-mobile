import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useOnboarding } from '../../../core/onboarding';
import { onboardingStyles as s } from './onboardingStyles';

const ONLY_LETTERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const POSITIVE_INTEGER_REGEX = /^[1-9][0-9]*$/;

const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro'];

export const OnboardingIdentityScreen = ({ navigation }: any) => {
  const { formData, updateFormData } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [ageInput, setAgeInput] = useState(formData.age ? String(formData.age) : '');

  const handleContinue = () => {
    const age = parseInt(ageInput, 10);
    if (!age || age < 16 || age > 99) {
      setError('Ingresa una edad válida (16-99).');
      return;
    }
    if (!formData.gender) {
      setError('Selecciona un género.');
      return;
    }
    if (!formData.career.trim() || !ONLY_LETTERS_REGEX.test(formData.career.trim())) {
      setError('La carrera es obligatoria y solo puede contener letras.');
      return;
    }
    if (!formData.semester.trim() || !POSITIVE_INTEGER_REGEX.test(formData.semester.trim()) || parseInt(formData.semester, 10) > 12) {
      setError('El semestre debe ser un número entero entre 1 y 12.');
      return;
    }
    if (!formData.birthCity.trim() || !ONLY_LETTERS_REGEX.test(formData.birthCity.trim())) {
      setError('La ciudad de nacimiento es obligatoria y solo puede contener letras.');
      return;
    }

    setError(null);
    updateFormData({ age });
    navigation.navigate('OnboardingLifestyle');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.stepLabel}>Paso 1 de 4 · Identidad</Text>
      <Text style={s.title}>Verifica tu perfil institucional</Text>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: '25%' }]} /></View>

      <View style={s.section}>
        <Text style={s.label}>Nombre completo (Kinde)</Text>
        <TextInput style={[s.input, s.inputDisabled]} value={formData.name} editable={false} />

        <Text style={s.label}>Correo institucional</Text>
        <TextInput style={[s.input, s.inputDisabled]} value={formData.email} editable={false} />

        <Text style={s.label}>Edad</Text>
        <TextInput
          style={s.input}
          value={ageInput}
          onChangeText={setAgeInput}
          keyboardType="numeric"
          placeholder="Ej. 21"
        />

        <Text style={s.label}>Género</Text>
        <View style={s.optionRow}>
          {GENDER_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[s.optionBtn, formData.gender === option && s.optionBtnActive]}
              onPress={() => updateFormData({ gender: option })}
            >
              <Text style={[s.optionText, formData.gender === option && s.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>Ciudad de nacimiento</Text>
        <TextInput
          style={s.input}
          value={formData.birthCity}
          onChangeText={birthCity => updateFormData({ birthCity })}
          placeholder="Ej. Quito"
        />

        <Text style={s.label}>Carrera en la UCE</Text>
        <TextInput
          style={s.input}
          value={formData.career}
          onChangeText={career => updateFormData({ career })}
          placeholder="Ej. Ingeniería en Sistemas"
        />

        <Text style={s.label}>Semestre actual</Text>
        <TextInput
          style={s.input}
          value={formData.semester}
          onChangeText={semester => updateFormData({ semester })}
          keyboardType="numeric"
          placeholder="Ej. 7"
        />
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      <View style={s.footer}>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={s.backText}>← Volver al login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue}>
          <Text style={s.continueBtnText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
