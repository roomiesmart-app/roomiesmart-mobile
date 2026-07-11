import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SpaceRepository, PublishedSpace } from '../../infrastructure/SpaceRepository';
import { getSession, UserSession } from '../../core/session';

export const ExploreSpacesScreen = () => {
  const navigation = useNavigation<any>();
  const [session, setSession] = useState<UserSession | null>(null);
  const [spaces, setSpaces] = useState<PublishedSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (user) {
        setSession(user);
        loadSpaces();
      }
    };
    init();
  }, []);

  const loadSpaces = async () => {
    try {
      const spacesData = await SpaceRepository.getSpaces();
      setSpaces(spacesData);
    } catch (error) {
      console.error('Error loading spaces', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async (space: PublishedSpace) => {
    if (!session) return;
    setJoinStatus((prev) => ({ ...prev, [space.id]: 'sending' }));
    
    try {
      await SpaceRepository.requestToJoin(space.id, session.id);
      setJoinStatus((prev) => ({ ...prev, [space.id]: 'sent' }));
      Alert.alert('Éxito', 'Solicitud enviada correctamente');
    } catch (error: any) {
      const msg = error.message || 'Error al enviar solicitud';
      if (msg.includes('pendiente')) {
        setJoinStatus((prev) => ({ ...prev, [space.id]: 'sent' }));
      } else {
        setJoinStatus((prev) => ({ ...prev, [space.id]: '' }));
      }
      Alert.alert('Atención', msg);
    }
  };

  const renderItem = ({ item }: { item: PublishedSpace }) => {
    const imageUri = item.images && item.images.length > 0 
      ? item.images[0] 
      : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600';
    
    const status = joinStatus[item.id];
    
    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardType}>{item.spaceType}</Text>
            <Text style={styles.cardPrice}>${item.monthlyPrice}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardLocation}>📍 {item.neighborhood || 'Ubicación no especificada'}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.btn, styles.msgBtn, item.owner_id === session?.id && {opacity: 0.5}]} 
              onPress={() => {
                if (session && item.owner_id !== session?.id) {
                  navigation.navigate('Chat', {
                    targetUserId: item.owner_id,
                    targetName: item.owner_name || 'Propietario',
                    currentUserId: session.id
                  });
                }
              }}
              disabled={item.owner_id === session?.id}
            >
              <Text style={styles.msgBtnText}>Mensaje</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.joinBtn, status === 'sent' && styles.joinBtnSent, item.owner_id === session?.id && {opacity: 0.5}]} 
              onPress={() => handleRequestToJoin(item)}
              disabled={status === 'sent' || status === 'sending' || item.owner_id === session?.id}
            >
              <Text style={styles.joinBtnText}>
                {status === 'sending' ? 'Enviando...' : status === 'sent' ? 'Solicitado' : 'Solicitar unirse'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>Shared Spaces</Text>
            <Text style={styles.headerTitle}>Espacios disponibles</Text>
          </View>
          <TouchableOpacity 
            style={styles.publishBtn} 
            onPress={() => navigation.navigate('PublishSpace')}
          >
            <Text style={styles.publishBtnText}>+ Publicar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8C3A27" style={{ marginTop: 20 }} />
      ) : spaces.length === 0 ? (
        <Text style={styles.emptyText}>No hay espacios publicados en este momento.</Text>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  publishBtn: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  publishBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A3513D',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3B241C',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F2E3DB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    backgroundColor: '#FDF0EB',
    color: '#8C3A27',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3B241C',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: '#8C3A27',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#827471',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8C3A27',
  },
  msgBtnText: {
    color: '#8C3A27',
    fontWeight: 'bold',
    fontSize: 14,
  },
  joinBtn: {
    backgroundColor: '#8C3A27',
  },
  joinBtnSent: {
    backgroundColor: '#3B241C',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
