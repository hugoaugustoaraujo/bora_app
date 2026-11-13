import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getFormattedAvatarUrl, fetchUserProfile } from '../src/services/api';

export default function ProfileFriendScreen() {
  const params = useLocalSearchParams();
  const friendId = String(params.friendId || '');
  
  const { unfriendUser, blockUser } = useApp();
  const [menuVisible, setMenuVisible] = useState(false);

  // Estado para armazenar os dados atualizados do amigo buscados diretamente do backend
  const [friendData, setFriendData] = useState({
    name: String(params.friendName || 'Utilizador'),
    username: String(params.friendUsername || '@utilizador'),
    avatar_url: String(params.friendAvatar || ''),
    bio: String(params.friendBio || 'Praticante de esportes e atividades físicas.'),
  });

  useEffect(() => {
    if (friendId) {
      loadFriendFreshProfile();
    }
  }, [friendId]);

  // Recarrega o perfil do amigo pelo ID para garantir a foto e dados mais recentes
  const loadFriendFreshProfile = async () => {
    try {
      const profile = await fetchUserProfile(friendId);
      if (profile) {
        setFriendData({
          name: profile.name || friendData.name,
          username: profile.username || friendData.username,
          avatar_url: profile.avatar_url || friendData.avatar_url,
          bio: profile.bio || friendData.bio,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar perfil atualizado do amigo:', error);
    }
  };

  const handleUnfriend = async () => {
    setMenuVisible(false);
    await unfriendUser(friendId);
    router.back();
  };

  const handleBlock = async () => {
    setMenuVisible(false);
    await blockUser(friendId);
    router.back();
  };

  const friendAvatarFinal = getFormattedAvatarUrl(friendData.avatar_url);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Barra Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Perfil do Amigo</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="more-vertical" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card de Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: friendAvatarFinal }} style={styles.avatarLargeImage} />
          </View>
          
          <Text style={styles.userName}>{friendData.name}</Text>
          <Text style={styles.userHandle}>@{friendData.username}</Text>
          <Text style={styles.userLocation}>Maceió, AL</Text>
          <Text style={styles.userBio}>{friendData.bio}</Text>
        </View>

        {/* Esportes */}
        <Text style={styles.sectionTitle}>Esportes em comum</Text>
        <View style={styles.sportsContainer}>
          <View style={styles.sportChip}>
            <MaterialCommunityIcons name="volleyball" size={16} color="#F04E23" style={{ marginRight: 6 }} />
            <Text style={styles.sportChipText}>Vôlei</Text>
          </View>
        </View>

        {/* Botão de Chat Direto */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            router.push({
              pathname: '/chat',
              params: { friendId, friendName: friendData.name },
            } as any)
          }
        >
          <Ionicons name="chatbubble-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatButtonText}>Enviar Mensagem</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal de Opções */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeaderTitle}>Opções de Amizade</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleUnfriend}>
              <Ionicons name="person-remove-outline" size={18} color="#DC2626" style={{ marginRight: 10 }} />
              <Text style={styles.menuItemTextDestructive}>Desfazer amizade</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
              <Ionicons name="ban-outline" size={18} color="#DC2626" style={{ marginRight: 10 }} />
              <Text style={styles.menuItemTextDestructive}>Bloquear utilizador</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCancelItem} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  profileCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarLargeImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#F04E23' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  userHandle: { fontSize: 12, color: '#888', marginTop: 2 },
  userLocation: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  userBio: { fontSize: 12, color: '#4B5563', textAlign: 'center', marginTop: 8, paddingHorizontal: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  sportsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  sportChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, marginRight: 8, marginBottom: 8 },
  sportChipText: { fontSize: 12, fontWeight: 'bold', color: '#1A1A1A' },
  chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F04E23', height: 50, borderRadius: 16, marginTop: 10 },
  chatButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { width: '80%', maxWidth: 320, backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  menuHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemTextDestructive: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  menuCancelItem: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  menuCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});