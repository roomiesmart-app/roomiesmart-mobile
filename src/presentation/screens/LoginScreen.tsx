import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { fetchApi } from '../../core/api';
import { saveSession } from '../../core/session';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail.endsWith('@uce.edu.ec')) {
      Alert.alert('Error', 'El acceso es exclusivo para correos institucionales @uce.edu.ec');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi(`/api/v1/identity/check-status/${cleanEmail}`);
      
      if (response.exists && response.user) {
        // Guardar sesión y redirigir
        await saveSession(response.user);
        navigation.replace('MainApp');
      } else {
        Alert.alert('No registrado', 'Tu perfil no existe. Por favor, regístrate en la plataforma web primero para completar tu test de afinidad.');
      }
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

        <TextInput
          style={styles.input}
          placeholder="Correo UCE (ej. user@uce.edu.ec)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
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
