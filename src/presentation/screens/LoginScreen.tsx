import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthRepository } from '../../infrastructure/AuthRepository';
import { saveSession } from '../../core/session';
import { useKindeLogin, decodeIdToken } from '../../core/kindeAuth';
import { useOnboarding } from '../../core/onboarding';

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const { login, ready } = useKindeLogin();
  const { updateFormData } = useOnboarding();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const tokens = await login();
      if (!tokens) {
        // El usuario canceló el flujo de Kinde.
        return;
      }

      const claims = decodeIdToken(tokens.idToken);
      const email = (claims.email || '').trim().toLowerCase();

      if (!email.endsWith('@uce.edu.ec')) {
        Alert.alert('Error', 'El acceso es exclusivo para correos institucionales @uce.edu.ec');
        return;
      }

      const status = await AuthRepository.checkStatus(email);

      if (!status.exists) {
        // Guarda una sesión temporal (solo tokens) para que las llamadas autenticadas
        // del onboarding (POST /identity/onboarding, GET /identity/me) funcionen.
        await saveSession({
          ...tokens,
          user: {
            id: claims.sub,
            name: claims.given_name || claims.name || email.split('@')[0],
            email,
            departmentId: null,
          },
        });
        updateFormData({
          name: claims.given_name || claims.name || email.split('@')[0],
          email,
          externalId: claims.sub,
        });
        navigation.replace('OnboardingIdentity');
        return;
      }

      await saveSession({
        ...tokens,
        user: {
          id: claims.sub,
          name: claims.given_name || claims.name || email.split('@')[0],
          email,
          departmentId: null,
        },
      });

      const profile = await AuthRepository.getMe();
      await saveSession({
        ...tokens,
        user: {
          id: profile.id,
          name: claims.given_name || claims.name || email.split('@')[0],
          email: profile.email,
          departmentId: profile.departmentId ?? null,
        },
      });

      navigation.replace('MainApp');
    } catch (error: any) {
      Alert.alert('Error de conexión', error.message || 'No se pudo verificar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      
      <View style={styles.card}>
        <Text style={styles.title}>Roomie<Text style={styles.titleHighlight}>Smart</Text></Text>
        <Text style={styles.subtitle}>Tu vida universitaria, compartida.</Text>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading || !ready}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Ingresar con tu correo UCE</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Acceso exclusivo para estudiantes de{'\n'}Universidad Central del Ecuador
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#008779',
    opacity: 0.1,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#1E293B',
    opacity: 0.1,
  },
  card: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 5,
  },
  titleHighlight: {
    color: '#B95D46',
  },
  subtitle: {
    color: '#827471',
    fontSize: 14,
    marginBottom: 40,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#1E293B',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
});
