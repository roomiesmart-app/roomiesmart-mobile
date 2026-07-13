import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useOnboarding } from '../../../core/onboarding';
import { onboardingStyles as s } from './onboardingStyles';

const CLEANING_OPTIONS = ['Diaria', '2-3 veces/semana', 'Semanal'];
const SHARED_TASKS_OPTIONS = ['Compras conjuntas', 'Turnos de basura', 'Cocina por turnos', 'Lavandería organizada'];

export const OnboardingLifestyleScreen = ({ navigation }: any) => {
  const { formData, updateFormData } = useOnboarding();
  const { lifestyle } = formData;
  const [error, setError] = useState<string | null>(null);

  const toggleSharedTask = (task: string) => {
    const current = lifestyle.sharedTasks;
    const updated = current.includes(task) ? current.filter(t => t !== task) : [...current, task];
    updateFormData({ lifestyle: { ...lifestyle, sharedTasks: updated } });
  };

  const handleContinue = () => {
    if (!lifestyle.cleaningFrequency) {
      setError('Debes seleccionar una frecuencia de limpieza.');
      return;
    }
    if (lifestyle.sharedTasks.length === 0) {
      setError('Debes seleccionar al menos una tarea compartida.');
      return;
    }
    if (!lifestyle.isEarlyBird && !lifestyle.useCommonAreasAtNight) {
      setError('Selecciona al menos un ritmo de vida universitario.');
      return;
    }
    setError(null);
    navigation.navigate('OnboardingSocial');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.stepLabel}>Paso 2 de 4 · Hábitos y limpieza</Text>
      <Text style={s.title}>Cultivando la armonía</Text>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: '50%' }]} /></View>

      <View style={s.section}>
        <Text style={s.label}>🧹 Frecuencia de limpieza</Text>
        <View style={s.optionRow}>
          {CLEANING_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[s.optionBtn, lifestyle.cleaningFrequency === option && s.optionBtnActive]}
              onPress={() => updateFormData({ lifestyle: { ...lifestyle, cleaningFrequency: option } })}
            >
              <Text style={[s.optionText, lifestyle.cleaningFrequency === option && s.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>🕒 Ritmo de vida universitario</Text>
        <TouchableOpacity
          style={[s.optionBtn, lifestyle.isEarlyBird && s.optionBtnActive, { width: '100%', marginBottom: 10 }]}
          onPress={() => updateFormData({ lifestyle: { ...lifestyle, isEarlyBird: !lifestyle.isEarlyBird } })}
        >
          <Text style={[s.optionText, lifestyle.isEarlyBird && s.optionTextActive]}>
            ☀️ Team madrugador (clases desde temprano)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.optionBtn, lifestyle.useCommonAreasAtNight && s.optionBtnActive, { width: '100%' }]}
          onPress={() => updateFormData({ lifestyle: { ...lifestyle, useCommonAreasAtNight: !lifestyle.useCommonAreasAtNight } })}
        >
          <Text style={[s.optionText, lifestyle.useCommonAreasAtNight && s.optionTextActive]}>
            🦉 Búho nocturno (uso áreas comunes de noche)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.label}>👥 Tareas compartidas</Text>
        <View style={s.optionRow}>
          {SHARED_TASKS_OPTIONS.map(task => (
            <TouchableOpacity
              key={task}
              style={[s.optionBtn, lifestyle.sharedTasks.includes(task) && s.optionBtnActive]}
              onPress={() => toggleSharedTask(task)}
            >
              <Text style={[s.optionText, lifestyle.sharedTasks.includes(task) && s.optionTextActive]}>{task}</Text>
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
