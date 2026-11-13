import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const friendId = (params.friendId as string) || '3';
  const friendName = (params.friendName as string) || 'Amigo';

  const { chatMessages, loadChatMessages, sendMessageToFriend } = useApp();
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    loadChatMessages(friendId);
    const interval = setInterval(() => {
      loadChatMessages(friendId);
    }, 3000); // Polling simples a cada 3 segundos
    return () => clearInterval(interval);
  }, [friendId]);

  const messages = chatMessages[friendId] || [];

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    await sendMessageToFriend(friendId, textToSend);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{friendName}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Inicie a conversa enviando uma mensagem abaixo.</Text>
          ) : (
            messages.map((msg) => (
              <View key={msg.id} style={[styles.msgBubble, msg.sender === 'me' ? styles.myMsg : styles.otherMsg]}>
                <Text style={[styles.msgText, msg.sender === 'me' ? styles.myMsgText : styles.otherMsgText]}>
                  {msg.text}
                </Text>
                <Text style={styles.msgTime}>{msg.time}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Conversar com ${friendName}...`}
            placeholderTextColor="#A0A0A0"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 12 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  myMsg: { backgroundColor: '#F04E23', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  otherMsg: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 13 },
  myMsgText: { color: '#FFF' },
  otherMsgText: { color: '#1A1A1A' },
  msgTime: { fontSize: 9, color: '#888', marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, color: '#1A1A1A' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});