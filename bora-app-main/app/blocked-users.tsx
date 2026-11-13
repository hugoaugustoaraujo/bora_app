import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { api, getFormattedAvatarUrl } from '../src/services/api';

export default function BlockedUsersScreen() {
  const { userProfile } = useApp();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = async () => {
    if (!userProfile?.id) return;
    try {
      const res = await api.get(`/users/${userProfile.id}/blocked`);
      setBlockedUsers(res.data);
    } catch (error) {
      console.error('Erro ao buscar bloqueados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, [userProfile?.id]);

  const handleUnblock = async (targetId: number, targetName: string) => {
    try {
      await api.post('/users/unblock', { userId: userProfile?.id, targetId });
      setBlockedUsers((prev) => prev.filter((u) => u.id !== targetId));
      Alert.alert('Sucesso', `${targetName} foi desbloqueado(a).`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível desbloquear o utilizador.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Utilizadores Bloqueados</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F04E23" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {blockedUsers.length === 0 ? (
            <Text style={styles.emptyText}>Não tem nenhum utilizador bloqueado.</Text>
          ) : (
            blockedUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <Image source={{ uri: getFormattedAvatarUrl(user.avatar_url) }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.username}>{user.username}</Text>
                </View>
                <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(user.id, user.name)}>
                  <Text style={styles.unblockText}>Desbloquear</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  content: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 14 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  username: { fontSize: 11, color: '#888' },
  unblockBtn: { backgroundColor: '#FFF0ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  unblockText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
});