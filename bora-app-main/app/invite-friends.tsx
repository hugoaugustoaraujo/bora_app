import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApp } from '../context/AppContext';
import { fetchFriendsWithAvatars, FriendProfile } from '../src/services/api';

export default function InviteFriendsScreen() {
  const { loadFriends, userProfile, inviteFriendToMatch } = useApp();
  const [correlatedFriends, setCorrelatedFriends] = useState<FriendProfile[]>([]);
  const params = useLocalSearchParams();
  const matchId = params.matchId ? String(params.matchId) : '';

  const loadFriendsData = async () => {
    if (userProfile?.id) {
      if (loadFriends) loadFriends(userProfile.id);
      const friendsData = await fetchFriendsWithAvatars(userProfile.id);
      setCorrelatedFriends(friendsData);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFriendsData();
    }, [userProfile?.id])
  );

  const handleSendInvite = async (friendId: string | number, friendName: string) => {
    try {
      await inviteFriendToMatch(matchId, String(friendId));
      Alert.alert('Sucesso! ✉️', `Convite enviado para ${friendName} com sucesso!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o convite.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Convidar Amigos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Selecione os amigos que deseja convidar para esta partida:</Text>

        {!correlatedFriends || correlatedFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Você não tem amigos aceitos no momento.</Text>
          </View>
        ) : (
          correlatedFriends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.friendTopRow}>
                <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatarImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendGameDesc}>{friend.gameDesc}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => handleSendInvite(friend.id, friend.name)}
              >
                <Ionicons name="send-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.inviteBtnText}>Convidar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 12, fontSize: 13 },
  friendCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  friendTopRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  friendAvatarImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB' },
  friendName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  friendGameDesc: { fontSize: 11, color: '#888', marginTop: 1 },
  inviteBtn: { backgroundColor: '#F04E23', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  inviteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});