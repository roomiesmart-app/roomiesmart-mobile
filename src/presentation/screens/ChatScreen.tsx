import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ChatRepository } from '../../infrastructure/ChatRepository';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const ChatScreen = ({ route, navigation }: any) => {
  const { targetUserId, targetName, currentUserId } = route.params;
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Ref para manejar el polling y evitar conflictos de estado
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1) Iniciar o recuperar la conversación
    const initConversation = async () => {
      if (currentUserId === targetUserId) {
        setLoading(false);
        return; // No intentar crear conversación consigo mismo
      }
      try {
        const response = await ChatRepository.getOrCreateConversation({ currentUserId, targetUserId });
        setConversationId(response.conversationId);
      } catch (error) {
        console.error('Error iniciando conversación', error);
        setLoading(false);
      }
    };
    initConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    // 2) Cargar mensajes iniciales
    const loadMessages = async () => {
      try {
        const response = await ChatRepository.getMessages(conversationId);
        const data = Array.isArray(response) ? response : [];
        setMessages([...data].reverse());
      } catch (error) {
        console.error('Error cargando mensajes', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // 3) Polling cada 3 segundos como fallback para tiempo real
    timerRef.current = setInterval(async () => {
      try {
        const response = await ChatRepository.getMessages(conversationId, 20);
        const data = Array.isArray(response) ? response : [];
        setMessages([...data].reverse());
      } catch (e) {}
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !conversationId || sending) return;

    setSending(true);
    // Optimistic UI update
    const tempMsg: ChatMessage = {
      id: Math.random().toString(),
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setDraft('');

    try {
      await ChatRepository.sendMessage(conversationId, currentUserId, content);
      // El próximo polling sincronizará los verdaderos IDs
    } catch (error) {
      console.error('Error enviando mensaje', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{targetName}</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#8C3A27" />
        ) : messages.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay mensajes. ¡Rompe el hielo!</Text>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <View key={msg.id} style={[styles.bubbleWrapper, isMine ? styles.mineWrapper : styles.theirsWrapper]}>
                <View style={[styles.bubble, isMine ? styles.mineBubble : styles.theirsBubble]}>
                  <Text style={[styles.msgText, isMine ? styles.mineText : styles.theirsText]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!draft.trim() || !conversationId) && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!draft.trim() || !conversationId || sending}
        >
          <Text style={styles.sendBtnText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C3A27',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    marginRight: 15,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  bubbleWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  mineWrapper: {
    justifyContent: 'flex-end',
  },
  theirsWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  mineBubble: {
    backgroundColor: '#8C3A27',
    borderBottomRightRadius: 4,
  },
  theirsBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5D1C6',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mineText: {
    color: '#fff',
  },
  theirsText: {
    color: '#3B241C',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5D1C6',
  },
  input: {
    flex: 1,
    backgroundColor: '#FDF8F6',
    borderWidth: 1,
    borderColor: '#E5D1C6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 14,
    color: '#333',
  },
  sendBtn: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
