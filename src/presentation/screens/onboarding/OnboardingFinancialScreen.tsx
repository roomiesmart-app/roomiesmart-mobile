import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { buildOnboardingPayload, useOnboarding } from '../../../core/onboarding';
import { AuthRepository } from '../../../infrastructure/AuthRepository';
import { CatalogRepository, CatalogItem } from '../../../infrastructure/CatalogRepository';
import { updateSessionUser } from '../../../core/session';
import { onboardingStyles as s } from './onboardingStyles';

const ROOM_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'privada', label: 'Privada' },
  { value: 'compartida', label: 'Compartida' },
];

const EXPENSE_MANAGEMENT_OPTIONS: { value: string; title: string; desc: string }[] = [
  { value: 'fondo-comun', title: 'Fondo Común', desc: 'Aportamos una cantidad fija cada mes para todo el departamento.' },
  { value: 'division-digital', title: 'División Digital', desc: 'Cada uno paga lo suyo y ajustamos cuentas en la app.' },
  { value: 'individual', title: 'Todo Individual', desc: 'Cada roomie se encarga de sus propias compras exclusivamente.' },
];

const SHARED_ITEMS_OPTIONS = ['Nevera', 'Cafetera', 'Televisión', 'Productos limpieza', 'Lavadora', 'Microondas', 'Vajilla', 'Consola de juegos'];

const BUDGET_MIN = 150;
const BUDGET_MAX = 300;
const BUDGET_STEP = 10;

export const OnboardingFinancialScreen = ({ navigation }: any) => {
  const { formData, updateFormData } = useOnboarding();
  const { financial } = formData;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commonAreas, setCommonAreas] = useState<CatalogItem[]>([]);

  useEffect(() => {
    CatalogRepository.getCommonAreas()
      .then(setCommonAreas)
      .catch(err => console.error('Error cargando áreas comunes', err));
  }, []);

  const toggleSharedItem = (item: string) => {
    const updated = financial.sharedItems.includes(item)
      ? financial.sharedItems.filter(i => i !== item)
      : [...financial.sharedItems, item];
    updateFormData({ financial: { ...financial, sharedItems: updated } });
  };

  const togglePreferredArea = (name: string) => {
    const updated = financial.preferredCommonAreas.includes(name)
      ? financial.preferredCommonAreas.filter(a => a !== name)
      : [...financial.preferredCommonAreas, name];
    updateFormData({ financial: { ...financial, preferredCommonAreas: updated } });
  };

  const adjustBudget = (delta: number) => {
    const next = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, financial.budgetRange.max + delta));
    updateFormData({ financial: { ...financial, budgetRange: { min: BUDGET_MIN, max: next } } });
  };

  const handleFinish = async () => {
    if (!financial.roomType) {
      setError('Selecciona un tipo de habitación.');
      return;
    }
    if (!financial.expenseManagement) {
      setError('Selecciona una forma de gestionar gastos.');
      return;
    }
    if (financial.sharedItems.length === 0) {
      setError('Selecciona al menos un objeto compartido.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await AuthRepository.completeOnboarding(buildOnboardingPayload(formData));

      const profile = await AuthRepository.getMe();
      await updateSessionUser({
        id: profile.id,
        name: formData.name,
        email: profile.email,
        departmentId: profile.departmentId ?? null,
      });

      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error al crear tu perfil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.stepLabel}>Paso 4 de 4 · Presupuesto y finanzas</Text>
      <Text style={s.title}>Últimos detalles</Text>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: '100%' }]} /></View>

      <View style={s.section}>
        <Text style={s.label}>Presupuesto mensual (${BUDGET_MIN} - ${BUDGET_MAX})</Text>
        <View style={s.stepperRow}>
          <TouchableOpacity style={s.stepperBtn} onPress={() => adjustBudget(-BUDGET_STEP)}>
            <Text style={s.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={s.stepperValue}>Hasta ${financial.budgetRange.max}</Text>
          <TouchableOpacity style={s.stepperBtn} onPress={() => adjustBudget(BUDGET_STEP)}>
            <Text style={s.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Preferencia de habitación</Text>
        <View style={s.optionRow}>
          {ROOM_TYPE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[s.optionBtn, financial.roomType === option.value && s.optionBtnActive]}
              onPress={() => updateFormData({ financial: { ...financial, roomType: option.value } })}
            >
              <Text style={[s.optionText, financial.roomType === option.value && s.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Gestión de gastos</Text>
        {EXPENSE_MANAGEMENT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[s.optionBtn, financial.expenseManagement === option.value && s.optionBtnActive, { width: '100%', marginBottom: 10 }]}
            onPress={() => updateFormData({ financial: { ...financial, expenseManagement: option.value } })}
          >
            <Text style={[s.optionText, financial.expenseManagement === option.value && s.optionTextActive]}>{option.title}</Text>
            <Text style={[s.optionText, { fontWeight: '400', fontSize: 11, marginTop: 2 }, financial.expenseManagement === option.value && s.optionTextActive]}>
              {option.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {commonAreas.length > 0 && (
        <View style={s.section}>
          <Text style={s.label}>Áreas comunes preferidas</Text>
          <View style={s.optionRow}>
            {commonAreas.map(area => (
              <TouchableOpacity
                key={area.id}
                style={[s.optionBtn, financial.preferredCommonAreas.includes(area.name) && s.optionBtnActive]}
                onPress={() => togglePreferredArea(area.name)}
              >
                <Text style={[s.optionText, financial.preferredCommonAreas.includes(area.name) && s.optionTextActive]}>{area.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.label}>Objetos compartidos</Text>
        <View style={s.optionRow}>
          {SHARED_ITEMS_OPTIONS.map(item => (
            <TouchableOpacity
              key={item}
              style={[s.optionBtn, financial.sharedItems.includes(item) && s.optionBtnActive]}
              onPress={() => toggleSharedItem(item)}
            >
              <Text style={[s.optionText, financial.sharedItems.includes(item) && s.optionTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      <View style={s.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={submitting}>
          <Text style={s.backText}>← Paso anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.continueBtn, submitting && s.continueBtnDisabled]}
          onPress={handleFinish}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.continueBtnText}>Finalizar perfil 🚀</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
