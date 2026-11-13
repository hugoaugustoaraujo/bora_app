// app/(tabs)/tela-inicio.tsx
import React, { useEffect, useState, useCallback, createElement } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform } from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../../context/AppContext';
import * as Location from 'expo-location';
import { api, getFormattedAvatarUrl, fetchFriendsWithAvatars, FriendProfile } from '../../src/services/api';

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.log('react-native-maps não disponível nesta plataforma');
  }
}

export default function TelaInicioScreen() {
  const { userProfile, matches, loadFriends, isDarkMode } = useApp();
  const [correlatedFriends, setCorrelatedFriends] = useState<FriendProfile[]>([]);
  
  const [userLocation, setUserLocation] = useState({
    latitude: -9.6658,
    longitude: -35.7353,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const reloadFriendsAvatars = async () => {
    if (userProfile?.id) {
      if (loadFriends) loadFriends(userProfile.id);
      const friendsData = await fetchFriendsWithAvatars(userProfile.id);
      setCorrelatedFriends(friendsData);
    }
  };

  useFocusEffect(
    useCallback(() => {
      reloadFriendsAvatars();
      requestUserLocation();
    }, [userProfile?.id])
  );

  const requestUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      setUserLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      if (userProfile?.id) {
        await api.patch(`/users/${userProfile.id}/location`, { latitude, longitude });
      }
    } catch (error) {
      console.error('Erro ao obter geolocalização:', error);
    }
  };

  const avatarUrl = getFormattedAvatarUrl(userProfile?.avatarUrl || userProfile?.avatar_url || userProfile?.avatar);
  const name = userProfile?.name || 'Visitante';
  const locationName = userProfile?.location || 'Maceió, AL';

  const theme = {
    bg: isDarkMode ? '#121212' : '#FAFAFA',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#6B7280',
    border: isDarkMode ? '#2E2E2E' : '#E5E7EB',
  };

  const interactiveLeafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker([${userLocation.latitude}, ${userLocation.longitude}]).addTo(map)
          .bindPopup('A sua localização atual').openPopup();

        var matches = ${JSON.stringify(matches || [])};
        matches.forEach(function(m) {
          if(m.latitude && m.longitude) {
            L.marker([m.latitude, m.longitude]).addTo(map)
              .bindPopup('<b>' + m.title + '</b><br/>' + (m.locationOrPlatform || m.location_name || ''));
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.userInfoRow} 
            onPress={() => router.push('/profile' as any)}
          >
            <Image source={{ uri: avatarUrl }} style={[styles.userAvatar, { borderColor: theme.border }]} />
            <View>
              <Text style={[styles.welcomeText, { color: theme.text }]}>Olá, {name}</Text>
              <Text style={[styles.locationText, { color: theme.subText }]}>Localização atual: {locationName}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroSubHeader}>ENCONTROS DE VERDADE A UM CLIQUE DE DISTÂNCIA</Text>
        <Text style={[styles.heroMainTitle, { color: theme.text }]}>Bora?</Text>
        <Text style={[styles.heroDescription, { color: theme.subText }]}>Encontre pessoas para participarem de suas partidas.</Text>

        <View style={[styles.mapSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.mapPreviewContainer}>
            {Platform.OS !== 'web' && MapView ? (
              <MapView
                style={styles.mapView}
                region={userLocation}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                <Marker
                  coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                  title="Você está aqui"
                >
                  <View style={styles.mapPinIconBox}>
                    <FontAwesome name="arrow-up" size={14} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                </Marker>

                {(matches || []).map((m: any) => (
                  m.latitude && m.longitude ? (
                    <Marker
                      key={m.id}
                      coordinate={{ latitude: Number(m.latitude), longitude: Number(m.longitude) }}
                      title={m.title}
                      description={m.locationOrPlatform || m.location_name}
                    />
                  ) : null
                ))}
              </MapView>
            ) : (
              createElement('iframe', {
                srcDoc: interactiveLeafletHtml,
                style: { width: '100%', height: '100%', border: 0 },
              })
            )}

            <TouchableOpacity style={[styles.expandMapBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push('/map-view' as any)}>
              <Feather name="maximize-2" size={14} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapFooterRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapFooterTitle, { color: theme.text }]}>Partidas na proximidade</Text>
              <Text style={[styles.mapFooterSub, { color: theme.subText }]}>Baseado na sua geolocalização atual</Text>
            </View>
            <TouchableOpacity 
              style={styles.mapActionBtn} 
              onPress={() => {
                const firstMatchId = matches?.[0]?.id;
                if (firstMatchId) {
                  router.push({ pathname: '/match-details', params: { matchId: firstMatchId } } as any);
                } else {
                  router.push('/match-details' as any);
                }
              }}
            >
              <Text style={styles.mapActionText}>Ver partida</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.agendaSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.agendaHeaderRow}>
            <Text style={[styles.agendaSectionTitle, { color: theme.text }]}>Partidas Confirmadas</Text>
            <Text style={[styles.agendaCountBadge]}>{matches?.length || 0} partida(s)</Text>
          </View>

          {(matches || []).slice(0, 1).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.agendaItemCard, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA', borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/match-details', params: { matchId: item.id } } as any)}
            >
              <View style={styles.agendaItemTop}>
                <View style={styles.agendaIconBox}>
                  <FontAwesome name="arrow-up" size={16} color="#F04E23" style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.agendaMatchTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.agendaMatchSub, { color: theme.subText }]}>Encontro presencial</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>

              <View style={styles.agendaDetailsRow}>
                <View style={styles.detailRowItem}>
                  <Ionicons name="calendar-outline" size={13} color={theme.subText} style={{ marginRight: 4 }} />
                  <Text style={[styles.detailText, { color: theme.subText }]}>{item.date}</Text>
                </View>
                <View style={styles.detailRowItem}>
                  <Ionicons name="location-outline" size={13} color={theme.subText} style={{ marginRight: 4 }} />
                  <Text style={[styles.detailText, { color: theme.subText }]}>{item.locationOrPlatform}</Text>
                </View>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                <View style={styles.progressBarFill} />
              </View>

              <View style={styles.agendaFooterRow}>
                <Text style={[styles.participantsRatioText, { color: theme.subText }]}>3/10 pessoas</Text>
                <Text style={styles.viewMatchLink}>Ver partida</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.seeAllBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push('/matches' as any)}>
          <Text style={[styles.seeAllBtnText, { color: theme.text }]}>Ver todas as partidas</Text>
        </TouchableOpacity>

        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Amigos ativos</Text>
          <TouchableOpacity onPress={() => router.push('/friends' as any)}>
            <Text style={styles.seeAllText}>Ver amigos</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsHorizontalList}>
          {(correlatedFriends || []).map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendHorizontalChip}
              onPress={() => router.push({ pathname: '/chat', params: { friendId: friend.id, friendName: friend.name } } as any)}
            >
              <View style={styles.friendAvatarBox}>
                <Image 
                  source={{ uri: friend.avatarUrl }} 
                  style={[styles.friendAvatarImage, { borderColor: theme.border }]} 
                />
                {friend.isOnline && <View style={styles.onlineDot} />}
              </View>
              <Text style={[styles.friendNameText, { color: theme.text }]}>
                {friend.name ? friend.name.split(' ')[0] : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, marginRight: 12 },
  welcomeText: { fontSize: 16, fontWeight: 'bold' },
  locationText: { fontSize: 11, marginTop: 1 },
  notificationBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  heroSubHeader: { fontSize: 10, fontWeight: 'bold', color: '#16A34A', letterSpacing: 1, marginBottom: 4 },
  heroMainTitle: { fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  heroDescription: { fontSize: 13, marginBottom: 16 },
  mapSectionCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  mapPreviewContainer: { height: 180, position: 'relative', overflow: 'hidden' },
  mapView: { width: '100%', height: '100%' },
  mapPinIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  expandMapBtn: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, zIndex: 10, backgroundColor: '#FFF' },
  mapFooterRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  mapFooterTitle: { fontSize: 14, fontWeight: 'bold' },
  mapFooterSub: { fontSize: 11, marginTop: 2 },
  mapActionBtn: { backgroundColor: '#FFF0ED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  mapActionText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
  agendaSectionCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  agendaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  agendaSectionTitle: { fontSize: 16, fontWeight: 'bold' },
  agendaCountBadge: { fontSize: 11, fontWeight: 'bold', color: '#16A34A', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  agendaItemCard: { borderRadius: 14, padding: 12, borderWidth: 1 },
  agendaItemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  agendaIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center' },
  agendaMatchTitle: { fontSize: 14, fontWeight: 'bold' },
  agendaMatchSub: { fontSize: 11, marginTop: 1 },
  agendaDetailsRow: { marginBottom: 10 },
  detailRowItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  detailText: { fontSize: 12 },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { width: '30%', height: '100%', backgroundColor: '#F04E23' },
  agendaFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantsRatioText: { fontSize: 11, fontWeight: '600' },
  viewMatchLink: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
  seeAllBtn: { borderWidth: 1, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  seeAllBtnText: { fontSize: 13, fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAllText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
  friendsHorizontalList: { flexDirection: 'row' },
  friendHorizontalChip: { alignItems: 'center', marginRight: 16 },
  friendAvatarBox: { width: 48, height: 48, borderRadius: 24, position: 'relative' },
  friendAvatarImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 1 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#FFF' },
  friendNameText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});