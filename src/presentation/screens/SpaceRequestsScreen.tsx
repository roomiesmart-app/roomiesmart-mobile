import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SpaceRepository } from '../../infrastructure/SpaceRepository';
import { getSession, UserSession } from '../../core/session';
import { useNavigation } from '@react-navigation/native';
import { Check, X, ArrowLeft } from 'lucide-react-native';

export const SpaceRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadSessionAndRequests();
  }, []);

  const loadSessionAndRequests = async () => {
    const user = await getSession();
    if (user) {
      setSession(user);
      await loadRequests(user.id);
    }
  };

  const loadRequests = async (ownerId: string) => {
    setLoading(true);
    try {
      const response = await SpaceRepository.getRequests(ownerId);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error cargando solicitudes', error);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (requestId: string, action: 'accept' | 'reject') => {
    if (!session) return;
    try {
      await SpaceRepository.resolveRequest(requestId, session.id, action);
      Alert.alert('Éxito', `Solicitud ${action === 'accept' ? 'aceptada' : 'rechazada'}.`);
      loadRequests(session.id);
    } catch (error: any) {
      console.error('Error resolviendo solicitud', error);
      Alert.alert('Error', error.message || 'Hubo un problema resolviendo la solicitud.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.title}>Solicitud para: {item.spaces?.title || 'Espacio'}</Text>
          <Text style={styles.subtitle}>De: {item.users?.email || 'Usuario'}</Text>
          {item.message ? <Text style={styles.message}>Mensaje: "{item.message}"</Text> : null}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]} 
            onPress={() => handleResolve(item.id, 'accept')}>
            <Check color="#FFF" size={20} />
            <Text style={styles.actionText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleResolve(item.id, 'reject')}>
            <X color="#FFF" size={20} />
            <Text style={styles.actionText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de Ingreso</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8C3A27" style={styles.loader} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes solicitudes pendientes.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F2E3DB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  loader: {
    marginTop: 50,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardInfo: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  message: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  rejectBtn: {
    backgroundColor: '#F44336',
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  }
});
