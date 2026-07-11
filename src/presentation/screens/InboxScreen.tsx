import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchApi } from '../../core/api';
import { getSession, UserSession } from '../../core/session';

interface InboxItem {
  conversationId: string;
  participant: { id: string; email: string } | null;
  lastMessage: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
}

export const InboxScreen = () => {
  const navigation = useNavigation<any>();
  const [session, setSession] = useState<UserSession | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (user) {
        setSession(user);
        loadInbox(user.id);
      }
    };
    
    // Refresh when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      init();
    });

    init();
    return unsubscribe;
  }, [navigation]);

  const loadInbox = async (userId: string) => {
    try {
      const response = await fetchApi(`/api/v1/roomies/conversations/user/${userId}`);
      setInbox(response.data || []);
    } catch (error) {
      console.error('Error loading inbox', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (item: InboxItem) => {
    if (!session || !item.participant) return;
    const name = item.participant.email.split('@')[0];
    
    navigation.navigate('Chat', {
      targetUserId: item.participant.id,
      targetName: name,
      currentUserId: session.id
    });
  };

  const renderItem = ({ item }: { item: InboxItem }) => {
    const name = item.participant?.email?.split('@')[0] || 'Usuario UCE';
    const msg = item.lastMessage?.content || 'No hay mensajes aún';
    const isMe = item.lastMessage?.sender_id === session?.id;

    return (
      <TouchableOpacity style={styles.chatCard} onPress={() => openChat(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{name}</Text>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {isMe ? 'Tú: ' : ''}{msg}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Mensajes</Text>
        <Text style={styles.headerTitle}>Bandeja de Entrada</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8C3A27" style={{ marginTop: 20 }} />
      ) : inbox.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tienes conversaciones todavía</Text>
          <Text style={styles.emptyText}>Explora espacios o roomies y envía tu primer mensaje.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Espacios')}>
            <Text style={styles.exploreBtnText}>Explorar espacios</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={(item) => item.conversationId}
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
    backgroundColor: '#FDF8F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontSize: 28,
    fontWeight: '900',
    color: '#3B241C',
  },
  emptyContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B241C',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#827471',
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1DED6',
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8C3A27',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    color: '#827471',
  },
});
