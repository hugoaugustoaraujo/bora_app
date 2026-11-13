import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getFormattedAvatarUrl, fetchFriendsWithAvatars, FriendProfile } from '../../src/services/api';

export default function FriendsScreen() {
  const { pendingRequests, loadFriends, userProfile, acceptFriendRequest, rejectFriendRequest } = useApp();
  const [correlatedFriends, setCorrelatedFriends] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredFriends = correlatedFriends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Amigos</Text>
          <TouchableOpacity 
            style={styles.addUserBtn} 
            onPress={() => router.push('/add-friend' as any)}
          >
            <Ionicons name="person-add-outline" size={18} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busque por nome ou @usuário"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Secção de Pedidos Pendentes */}
        {pendingRequests && pendingRequests.length > 0 && (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>Pedidos pendentes</Text>
              <Text style={styles.sectionCounter}>{pendingRequests.length} solicitações</Text>
            </View>

            {pendingRequests.map((reqUser) => {
              const reqAvatar = getFormattedAvatarUrl(reqUser.avatarUrl || reqUser.avatar_url || reqUser.avatar);
              return (
                <View key={reqUser.id} style={styles.friendCard}>
                  <View style={styles.friendTopRow}>
                    <Image source={{ uri: reqAvatar }} style={styles.friendAvatarImage} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.friendName}>{reqUser.name}</Text>
                      <Text style={styles.friendGameDesc}>{reqUser.gameDesc}</Text>
                    </View>
                  </View>
                  <View style={styles.friendActionsRow}>
                    <TouchableOpacity 
                      style={styles.chatActionBtn} 
                      onPress={() => acceptFriendRequest(reqUser.id)}
                    >
                      <Text style={styles.chatActionText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.inviteActionBtn} 
                      onPress={() => rejectFriendRequest(reqUser.id)}
                    >
                      <Text style={styles.inviteActionText}>Recusar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Secção de Seus Amigos Correlacionados */}
        <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Seus amigos</Text>
          <Text style={styles.sectionCounter}>{correlatedFriends.length} amigos</Text>
        </View>

        {filteredFriends.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Nenhum amigo encontrado.</Text>
        ) : (
          filteredFriends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <TouchableOpacity 
                style={styles.friendTopRow}
                onPress={() =>
                  router.push({
                    pathname: '/profile-friend',
                    params: {
                      friendId: friend.id,
                      friendName: friend.name,
                      friendUsername: friend.username,
                      friendAvatar: friend.avatarUrl,
                      friendBio: friend.gameDesc,
                    },
                  } as any)
                }
              >
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatarImage} />
                  <View style={[styles.statusIndicator, friend.isOnline ? styles.statusOnline : styles.statusOffline]} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendGameDesc}>{friend.gameDesc}</Text>
                </View>
                <Text style={friend.isOnline ? styles.friendStatusTextOnline : styles.friendStatusTextOffline}>
                  {friend.isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>

              <View style={styles.friendActionsRow}>
                <TouchableOpacity
                  style={styles.chatActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/chat',
                      params: { friendId: friend.id, friendName: friend.name },
                    } as any)
                  }
                >
                  <Ionicons name="chatbubble-outline" size={14} color="#F04E23" style={{ marginRight: 6 }} />
                  <Text style={styles.chatActionText}>Conversar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.inviteActionBtn}>
                  <Ionicons name="person-add-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.inviteActionText}>Convidar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  addUserBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 12, height: 46, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  sectionCounter: { fontSize: 11, color: '#888' },
  friendCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 14, marginBottom: 12 },
  friendTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative' },
  friendAvatarImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB' },
  statusIndicator: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  statusOnline: { backgroundColor: '#10B981' },
  statusOffline: { backgroundColor: '#9CA3AF' },
  friendName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  friendGameDesc: { fontSize: 11, color: '#888', marginTop: 1 },
  friendStatusTextOnline: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  friendStatusTextOffline: { fontSize: 11, color: '#888' },
  friendActionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  chatActionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 9, borderRadius: 12 },
  chatActionText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
  inviteActionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F04E23', paddingVertical: 9, borderRadius: 12 },
  inviteActionText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
});