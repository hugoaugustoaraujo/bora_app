import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getFormattedAvatarUrl } from '../src/services/api';

export default function AddFriendScreen() {
  const { searchUserByUsername, sendFriendRequest } = useApp();
  const [usernameInput, setUsernameInput] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async () => {
    const cleanQuery = usernameInput.replace('@', '').trim();
    if (!cleanQuery) {
      Alert.alert('Atenção', 'Digite um username para pesquisar.');
      return;
    }

    setLoading(true);
    setSearchedUser(null);
    setNotFound(false);
    setRequestSent(false);
    setErrorMessage('');

    try {
      const user = await searchUserByUsername(cleanQuery);
      const avatarFinal = getFormattedAvatarUrl(user.avatar_url);

      setSearchedUser({ ...user, avatarUrl: avatarFinal });
    } catch (error: any) {
      const serverMessage = error.message || '';
      if (serverMessage.includes('não encontrado') || serverMessage.includes('404')) {
        setNotFound(true);
      } else {
        setErrorMessage(serverMessage || 'Erro ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedUser) return;
    try {
      await sendFriendRequest(searchedUser.id);
      setRequestSent(true);
      Alert.alert('Sucesso! 🚀', 'Pedido de amizade enviado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar o pedido.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Adicionar Amigo</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructionText}>Pesquise pelo @username do seu colega para enviar uma solicitação.</Text>

        <View style={styles.searchBox}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="username"
            placeholderTextColor="#A0A0A0"
            value={usernameInput}
            onChangeText={(text) => {
              setUsernameInput(text);
              if (notFound) setNotFound(false);
              if (errorMessage) setErrorMessage('');
            }}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="search" size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {notFound && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>Utilizador não encontrado ou já adicionado.</Text>
          </View>
        )}

        {errorMessage ? (
          <View style={[styles.errorContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={[styles.errorText, { color: '#D97706' }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {searchedUser && (
          <View style={styles.resultCard}>
            <Image source={{ uri: searchedUser.avatarUrl }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{searchedUser.name}</Text>
              <Text style={styles.userHandle}>@{searchedUser.username}</Text>
              <Text style={styles.userBio}>{searchedUser.bio || searchedUser.location_name || 'Sem bio'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, requestSent && styles.actionBtnSent]}
              onPress={handleSendRequest}
              disabled={requestSent}
            >
              <Ionicons
                name={requestSent ? 'checkmark' : 'person-add'}
                size={16}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionBtnText}>{requestSent ? 'Enviado' : 'Convidar'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  content: { padding: 20 },
  instructionText: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, height: 50, marginBottom: 12 },
  atSymbol: { fontSize: 16, fontWeight: 'bold', color: '#F04E23', marginRight: 4 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  searchBtn: { backgroundColor: '#F04E23', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  resultCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  userHandle: { fontSize: 12, color: '#888', marginTop: 2 },
  userBio: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  actionBtn: { backgroundColor: '#F04E23', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  actionBtnSent: { backgroundColor: '#10B981' },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});