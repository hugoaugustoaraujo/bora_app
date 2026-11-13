import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { api } from '../../src/services/api';

// (Opcional se usar Socket.io real-time)
// import { useSocket } from '../../context/SocketContext';

interface ChatMessageFront {
  id: string;
  sender_id: number;
  message_text: string;
  created_at: string;
  timeAgo: string; // Opcional, ou formatado no frontend
}

export default function ChatScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { userProfile } = useApp();
  // const socket = useSocket(); // Opcional real-time
  
  const [messages, setMessages] = useState<ChatMessageFront[]>([]);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const loadChatData = async () => {
    if (!userProfile?.id || !friendId) return;
    try {
      // 1. Carregar perfil do amigo (para avatar, nome)
      const friendResponse = await api.get(`/users/${friendId}`);
      setFriendProfile(friendResponse.data);

      // 2. Carregar histórico de mensagens persistentes
      const messagesResponse = await api.get(`/users/${userProfile.id}/chat/${friendId}`);
      // Opcional: formatação no frontend para avatares e timestamps
      setMessages(messagesResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados do chat:', error);
    } finally {
      setLoading(false);
      // Rolar para o final após carregar
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  useEffect(() => {
    loadChatData();
    
    // (Opcional) Ouvir mensagens Socket.io real-time
    /*
    if (socket && userProfile?.id) {
      const roomName = `chat_${Math.min(userProfile.id, Number(friendId))}_${Math.max(userProfile.id, Number(friendId))}`;
      socket.emit('join_room', roomName);
      
      socket.on('new_message', (message: ChatMessageFront) => {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      });

      return () => {
        socket.off('new_message');
        socket.emit('leave_room', roomName);
      };
    }
    */
  }, [userProfile?.id, friendId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userProfile?.id || !friendId) return;
    setSending(true);
    try {
      // 1. Enviar mensagem persistente via API
      // (Opcional: enviar anexos junto se implementado upload)
      const response = await api.post('/messages', {
        sender_id: userProfile.id,
        receiver_id: Number(friendId),
        message_text: inputText.trim(),
        // attachments: [] // Opcional
      });
      
      const newMessage = response.data;
      
      // 2. Atualizar UI localmente
      setMessages((prev) => [...prev, newMessage]);
      setInputText('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      
      // (Opcional) Enviar via Socket.io real-time
      /*
      if (socket) {
        const roomName = `chat_${Math.min(userProfile.id, Number(friendId))}_${Math.max(userProfile.id, Number(friendId))}`;
        socket.emit('send_message', { roomName, ...newMessage });
      }
      */
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    Alert.alert('Funcionalidade', 'Implementar seletor de imagens/arquivos aqui (S3, etc.)');
    // Pseudocódigo:
    // 1. Abrir seletor de mídia
    // 2. Upload para S3/Local
    // 3. Obter URL final
    // 4. Salvar localmente no state e enviar no handleSendMessage
  };

  const renderFriendAvatar = () => {
    let avatarFinal = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
    if (friendProfile?.avatar_url) {
      avatarFinal = friendProfile.avatar_url.startsWith('http')
        ? friendProfile.avatar_url
        : `http://192.168.56.1:3000/images/${friendProfile.avatar_url}`;
    }
    return <Image source={{ uri: avatarFinal }} style={styles.actorAvatar} />;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F04E23" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Barra Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.friendHeader}>
          {renderFriendAvatar()}
          <View>
            <Text style={styles.friendName}>{friendProfile?.name || 'Amigo'}</Text>
            <Text style={styles.friendStatus}>Online</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Área de Mensagens Persistentes */}
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            {renderFriendAvatar()}
            <Text style={styles.emptyText}>Inicie uma conversa com {friendProfile?.name}.</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userProfile?.id;
            return (
              <View key={msg.id} style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
                <Text style={[styles.messageText, isMe ? styles.messageMeText : styles.messageOtherText]}>
                  {msg.message_text}
                </Text>
                <Text style={styles.messageTime}>{msg.timeAgo}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Barra de Entrada de Texto estilo Bora */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachmentBtn} onPress={handleAttachment}>
          <Feather name="plus" size={20} color="#888" />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Escreva sua mensagem..."
          placeholderTextColor="#A0A0A0"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]} 
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  friendHeader: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  actorAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  friendStatus: { fontSize: 11, color: '#10B981', marginTop: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 13, color: '#888', marginTop: 16, textAlign: 'center' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  messageMe: { alignSelf: 'flex-end', backgroundColor: '#F04E23' }, // Bora orange
  messageOther: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  messageText: { fontSize: 13 },
  messageMeText: { color: '#FFF' },
  messageOtherText: { color: '#1A1A1A' },
  messageTime: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' }, // Tempo na bubble Me
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, marginHorizontal: 20 },
  attachmentBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  textInput: { flex: 1, fontSize: 13, color: '#1A1A1A', maxHeight: 80, paddingVertical: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendBtnDisabled: { backgroundColor: '#9CA3AF' },
});