// app/(tabs)/profile.tsx
import React from 'react';
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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { api, getFormattedAvatarUrl } from '../../src/services/api';

export default function ProfileScreen() {
  const { userProfile, friends, matches, logout, updateUserProfile, isDarkMode } = useApp();

  const handleLogout = () => {
    if (logout) logout();
    router.replace('/' as any);
  };

  const handlePickAvatar = async () => {
    if (!userProfile?.id) {
      Alert.alert('Erro', 'Utilizador não identificado.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Conceda permissão para selecionar uma foto de perfil.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0].uri) {
      const localUri = pickerResult.assets[0].uri;
      
      try {
        const formData = new FormData();
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('avatar', {
          uri: localUri,
          name: filename,
          type,
        } as any);

        const response = await api.post(`/users/${userProfile.id}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newAvatarUrl = response.data.avatar_url;

        updateUserProfile({ avatarUrl: newAvatarUrl });
        
        Alert.alert('Sucesso! 📸', 'Sua foto de perfil foi atualizada com sucesso.');
      } catch (error: any) {
        console.error('Erro ao enviar avatar:', error);
        Alert.alert('Erro', error.response?.data?.error || 'Não foi possível enviar a imagem para o servidor.');
      }
    }
  };

  const avatarUrl = getFormattedAvatarUrl(userProfile?.avatarUrl || userProfile?.avatar_url);
  const name = userProfile?.name || 'Visitante';
  const username = userProfile?.username || '@utilizador';
  const location = userProfile?.location || userProfile?.location_name || 'Maceió, AL';
  const bio = userProfile?.bio || 'Sem biografia definida.';

  const theme = {
    bg: isDarkMode ? '#121212' : '#FAFAFA',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#6B7280',
    border: isDarkMode ? '#2E2E2E' : '#E5E7EB',
    divider: isDarkMode ? '#2A2A2A' : '#E5E7EB',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho */}
        <View style={styles.topHeader}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
          <TouchableOpacity 
            style={[styles.settingsBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => router.push('/settings' as any)}
          >
            <Feather name="settings" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Card do Utilizador */}
        <View style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarLargeImage} />
            <View style={styles.cameraIconBadge}>
              <Feather name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.userHandle, { color: theme.subText }]}>{username}</Text>
          <Text style={[styles.userLocation, { color: theme.subText }]}>{location}</Text>
          <Text style={[styles.userBio, { color: theme.subText }]}>{bio}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <Feather name="edit-2" size={14} color="#F04E23" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        <View style={[styles.statsRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userProfile?.playedCount || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Partidas jogadas</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userProfile?.organizedCount || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Organizadas</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{friends?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Amigos</Text>
          </View>
        </View>

        {/* Esportes */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Esportes Favoritos</Text>
        <View style={styles.sportsContainer}>
          <View style={[styles.sportChip, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="volleyball" size={16} color="#F04E23" style={{ marginRight: 6 }} />
            <Text style={[styles.sportChipText, { color: theme.text }]}>Vôlei</Text>
          </View>
          <View style={[styles.sportChip, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="basketball" size={16} color="#F04E23" style={{ marginRight: 6 }} />
            <Text style={[styles.sportChipText, { color: theme.text }]}>Basquete</Text>
          </View>
        </View>

        {/* Deslogar */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarLargeImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#F04E23' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#F04E23', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 20, fontWeight: 'bold' },
  userHandle: { fontSize: 12, marginTop: 2 },
  userLocation: { fontSize: 12, marginTop: 4 },
  userBio: { fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 10 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 14 },
  editProfileText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
  statsRow: { borderWidth: 1, borderRadius: 18, paddingVertical: 14, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sportsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  sportChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, marginRight: 8, marginBottom: 8 },
  sportChipText: { fontSize: 12, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', height: 50, borderRadius: 16, marginTop: 10 },
  logoutButtonText: { color: '#DC2626', fontSize: 14, fontWeight: 'bold' },
});