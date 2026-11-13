// app/match-details.tsx
import React, { useState, useEffect, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { api, getFormattedAvatarUrl } from '../src/services/api';

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

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams();
  const matchIdParam = params.matchId ? String(params.matchId) : '';
  const { matches, userProfile, isDarkMode, loadMatches } = useApp();

  const match = matches.find((m) => String(m.id) === matchIdParam) || matches[0];
  
  const currentUserId = userProfile?.id || userProfile?.userId || userProfile?._id || userProfile?.uid;
  const organizerId = match?.organizer_id || match?.organizerId || match?.organizer?.id || match?.user?.id;

  const isOrganizer = Boolean(
    (currentUserId && organizerId && String(organizerId) === String(currentUserId)) ||
    match?.isOrganizer === true
  );
  
  const participantStatus = match?.participant_status; 
  const isConfirmed = participantStatus === 'confirmed' || isOrganizer;
  const isPendingInvite = participantStatus === 'pending';
  const isLotada = match ? match.vacancies <= 0 : false;

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customLocationName, setCustomLocationName] = useState(match?.locationOrPlatform || match?.location_name || '');
  const [matchCoords, setMatchCoords] = useState({
    latitude: match?.latitude || match?.lat || -9.6658,
    longitude: match?.longitude || match?.lng || -35.7353,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [resolvedParticipants, setResolvedParticipants] = useState<any[]>([]);

  useEffect(() => {
    let rawParticipants = match?.participants || [];

    const fetchParticipantsAvatars = async () => {
      const updated = await Promise.all(
        rawParticipants.map(async (p: any) => {
          const participantId = p.id || p.user_id;
          const isThisUserOrganizer = String(participantId) === String(organizerId) || p.role === 'Organizador';

          if (isThisUserOrganizer && String(participantId) === String(currentUserId)) {
            return {
              ...p,
              name: userProfile?.name || p.name || 'Você (Organizador)',
              avatarUrl: getFormattedAvatarUrl(userProfile?.avatarUrl || userProfile?.avatar_url || userProfile?.avatar),
              role: 'Organizador',
            };
          }

          try {
            const userRes = await api.get(`/users/${participantId}`);
            const userData = userRes.data;
            const rawAvatar = userData.avatar_url || userData.avatarUrl || userData.avatar || p.avatarUrl;

            return {
              ...p,
              name: userData.name || p.name || 'Participante',
              avatarUrl: getFormattedAvatarUrl(rawAvatar),
              role: isThisUserOrganizer ? 'Organizador' : (p.role || 'Participante'),
            };
          } catch (err) {
            return {
              ...p,
              avatarUrl: getFormattedAvatarUrl(p.avatarUrl || p.avatar_url || p.avatar),
              role: isThisUserOrganizer ? 'Organizador' : (p.role || 'Participante'),
            };
          }
        })
      );

      const organizerInList = updated.some((p: any) => String(p.id) === String(organizerId) || p.role === 'Organizador');
      if (!organizerInList && match) {
        const orgAvatar = isOrganizer 
          ? getFormattedAvatarUrl(userProfile?.avatarUrl || userProfile?.avatar_url || userProfile?.avatar)
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';

        updated.unshift({
          id: organizerId || 2,
          name: isOrganizer ? (userProfile?.name || 'Você (Organizador)') : 'Organizador da Partida',
          avatarUrl: orgAvatar,
          role: 'Organizador',
        });
      }

      setResolvedParticipants(updated);
    };

    fetchParticipantsAvatars();
  }, [match, userProfile]);

  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(() => {
      loadMatches(currentUserId);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MAP_CLICKED' && isOrganizer) {
          setMatchCoords((prev) => ({
            ...prev,
            latitude: event.data.lat,
            longitude: event.data.lng,
          }));
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isOrganizer]);

  const handleMapPress = (e: any) => {
    if (!isOrganizer) return;
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setMatchCoords((prev) => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    }
  };

  const handleMarkerDragEnd = (e: any) => {
    if (!isOrganizer) return;
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setMatchCoords((prev) => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    }
  };

  const handleSaveLocationChanges = async () => {
    try {
      await api.patch(`/matches/${match.id}/location`, {
        location_name: customLocationName,
        latitude: matchCoords.latitude,
        longitude: matchCoords.longitude,
      });

      if (loadMatches && currentUserId) {
        await loadMatches(currentUserId);
      }

      setIsEditingLocation(false);
      Alert.alert('Sucesso! 📍', 'Endereço e localização da partida atualizados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar localização:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o endereço da partida.');
    }
  };

  const handleParticipar = async () => {
    if (isConfirmed) return;
    if (isLotada) {
      Alert.alert('Partida Lotada', 'Infelizmente esta partida não possui vagas livres.');
      return;
    }
    if (match && currentUserId) {
      try {
        await api.post(`/matches/${match.id}/participate`, { userId: currentUserId });
        Alert.alert('Sucesso! 🎉', 'Sua presença foi confirmada nesta partida!');
        if (loadMatches) {
          await loadMatches(currentUserId);
        }
      } catch (error: any) {
        console.error('Erro ao confirmar presença:', error);
        Alert.alert('Erro', error?.response?.data?.error || 'Não foi possível confirmar presença.');
      }
    } else {
      Alert.alert('Erro', 'Utilizador não identificado.');
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    try {
      if (accept) {
        await api.post(`/matches/${match.id}/participate`, { userId: currentUserId });
        Alert.alert('Convite Aceito! 🎉', 'A sua presença foi confirmada na partida!');
      } else {
        await api.post(`/matches/${match.id}/decline-invite`, { userId: currentUserId });
        Alert.alert('Convite Recusado', 'Você recusou o convite para esta partida.');
      }
      if (loadMatches && currentUserId) {
        await loadMatches(currentUserId);
      }
    } catch (error) {
      console.error('Erro ao responder ao convite:', error);
      Alert.alert('Erro', 'Não foi possível processar a resposta ao convite.');
    }
  };

  const handleCancelMatch = () => {
    Alert.alert('Cancelar Partida', 'Tem certeza que deseja cancelar esta partida?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

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
        var map = L.map('map').setView([${matchCoords.latitude}, ${matchCoords.longitude}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var marker = L.marker([${matchCoords.latitude}, ${matchCoords.longitude}], {draggable: ${isOrganizer}}).addTo(map);

        ${isOrganizer ? `
          marker.on('dragend', function(event) {
            var position = marker.getLatLng();
            window.parent.postMessage({ type: 'MAP_CLICKED', lat: position.lat, lng: position.lng }, '*');
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            window.parent.postMessage({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
          });
        ` : ''}
      </script>
    </body>
    </html>
  `;

  const totalSpotsVal = match?.totalSpots || match?.total_spots || 0;
  const vacanciesVal = match?.vacancies ?? 0;
  const confirmedCount = Math.max(totalSpotsVal - vacanciesVal, 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/tela-inicio' as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Detalhes da partida</Text>
        {isOrganizer ? (
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={handleCancelMatch}>
            <Feather name="trash-2" size={18} color="#DC2626" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {isPendingInvite && (
          <View style={styles.pendingInviteBanner}>
            <Ionicons name="mail-unread-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={styles.pendingInviteText}>Você recebeu um convite pendente para esta partida. Confirme abaixo para garantir sua vaga!</Text>
          </View>
        )}

        <View style={[styles.mapSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.mapPreviewContainer}>
            {Platform.OS !== 'web' && MapView ? (
              <MapView
                style={styles.mapView}
                region={matchCoords}
                onPress={handleMapPress}
              >
                <Marker
                  coordinate={{ latitude: matchCoords.latitude, longitude: matchCoords.longitude }}
                  title={match?.title || 'Partida'}
                  description={customLocationName}
                  draggable={isOrganizer}
                  onDragEnd={isOrganizer ? handleMarkerDragEnd : undefined}
                >
                  <View style={styles.mapPinIconBox}>
                    <FontAwesome name="arrow-up" size={14} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                </Marker>
              </MapView>
            ) : (
              createElement('iframe', {
                srcDoc: interactiveLeafletHtml,
                style: { width: '100%', height: '100%', border: 0 },
              })
            )}
          </View>
          {isOrganizer && (
            <Text style={[styles.mapHintText, { color: theme.subText }]}>
              {isEditingLocation ? '📍 Toque no mapa ou arraste o marcador para definir o endereço exato' : '📍 Localização exata da partida no mapa'}
            </Text>
          )}
        </View>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.infoGroup}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Modalidade e Categoria</Text>
              <Text style={[styles.infoMainValue, { color: theme.text }]}>{match?.title || 'Partida Presencial'}</Text>
              <Text style={[styles.infoSubValue, { color: theme.subText }]}>{match?.category || 'Esportes'}</Text>
            </View>
          </View>
          <View style={styles.sportIconBox}>
            <FontAwesome name="arrow-up" size={18} color="#F04E23" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
        </View>

        <View style={[styles.locationCard, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF0ED', borderColor: theme.border }]}>
          <View style={[styles.locationIconBox, { backgroundColor: theme.cardBg }]}>
            <Ionicons name="location" size={20} color="#F04E23" />
          </View>
          
          <View style={styles.locationInfo}>
            <Text style={[styles.locationTitle, { color: theme.text }]}>{match?.date || match?.match_date || 'Data a definir'}</Text>
            
            {isEditingLocation ? (
              <View style={{ marginTop: 6 }}>
                <TextInput
                  style={[styles.editLocationInput, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
                  value={customLocationName}
                  onChangeText={setCustomLocationName}
                  placeholder="Digite o endereço correto"
                  placeholderTextColor="#A0A0A0"
                />
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity style={styles.saveLocationBtn} onPress={handleSaveLocationChanges}>
                    <Text style={styles.saveLocationText}>Salvar Endereço</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelLocationBtn} onPress={() => setIsEditingLocation(false)}>
                    <Text style={styles.cancelLocationText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.locationSub, { color: theme.subText, flex: 1 }]}>
                  {customLocationName || match?.locationOrPlatform || match?.location_name || 'Local a definir'}
                </Text>
                {isOrganizer && (
                  <TouchableOpacity onPress={() => setIsEditingLocation(true)} style={{ marginLeft: 8 }}>
                    <Ionicons name="pencil-outline" size={16} color="#F04E23" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quem vai jogar</Text>
            <Text style={[styles.sectionCounter, { color: theme.subText }]}>
              {confirmedCount} de {totalSpotsVal} confirmados
            </Text>
          </View>

          {resolvedParticipants.map((p: any, idx: number) => (
            <View key={p.id || idx} style={[styles.memberCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Image source={{ uri: p.avatarUrl }} style={styles.avatarImageReal} />
              <View style={styles.memberDetails}>
                <Text style={[styles.memberName, { color: theme.text }]}>{p.name}</Text>
                <Text style={[styles.memberRole, { color: theme.subText }]}>{p.role || 'Participante'}</Text>
              </View>
              <View style={styles.badgeColumn}>
                <View style={[styles.statusBadge, styles.badgeJoined]}>
                  <Text style={styles.badgeJoinedText}>Confirmado</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={[styles.emptySlotCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, isLotada && styles.slotCardFull]}>
            <Feather name={isLotada ? 'lock' : 'plus'} size={16} color={isLotada ? '#DC2626' : '#F04E23'} />
            <Text style={[styles.emptySlotText, { color: theme.subText }, isLotada && { color: '#DC2626', fontWeight: 'bold' }]}>
              {isLotada ? 'Partida Lotada (Sem vagas disponíveis)' : `Ainda cabem ${vacanciesVal} na quadra.`}
            </Text>
          </View>
        </View>

        {!isOrganizer && (
          isPendingInvite ? (
            <View style={styles.inviteResponseRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptInviteBtn]}
                onPress={() => handleRespondInvite(true)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>Aceitar Convite</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.declineInviteBtn]}
                onPress={() => handleRespondInvite(false)}
              >
                <Ionicons name="close-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>Recusar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isConfirmed && styles.actionButtonConfirmed,
                isLotada && !isConfirmed && styles.actionButtonDisabled
              ]}
              onPress={handleParticipar}
              disabled={isConfirmed || isLotada}
            >
              <Ionicons 
                name={isConfirmed ? "checkmark-done-circle" : "checkmark-circle-outline"} 
                size={18} 
                color="#FFF" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.actionButtonText}>
                {isConfirmed ? 'Presença confirmada!' : isLotada ? 'Partida Lotada' : 'Confirmar minha presença'}
              </Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => router.push({ pathname: '/invite-friends', params: { matchId: match?.id } } as any)}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.inviteButtonText}>Convidar amigos</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  pendingInviteBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, padding: 12, borderRadius: 14, marginBottom: 14 },
  pendingInviteText: { fontSize: 12, color: '#92400E', fontWeight: 'bold', flex: 1 },
  mapSectionCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  mapPreviewContainer: { height: 180, position: 'relative', overflow: 'hidden' },
  mapView: { width: '100%', height: '100%' },
  mapPinIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  mapHintText: { fontSize: 11, textAlign: 'center', paddingVertical: 6, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  infoGroup: { alignItems: 'flex-start' },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoMainValue: { fontSize: 16, fontWeight: 'bold' },
  infoSubValue: { fontSize: 11, marginTop: 2 },
  sportIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center' },
  locationCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  locationIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, alignSelf: 'flex-start' },
  locationInfo: { flex: 1 },
  locationTitle: { fontSize: 14, fontWeight: 'bold' },
  locationSub: { fontSize: 11, marginTop: 2 },
  editLocationInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 36, fontSize: 12, width: '100%' },
  saveLocationBtn: { backgroundColor: '#F04E23', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 8 },
  saveLocationText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  cancelLocationBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  cancelLocationText: { color: '#374151', fontSize: 11, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionCounter: { fontSize: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  avatarImageReal: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: 'bold' },
  memberRole: { fontSize: 11, marginTop: 2 },
  badgeColumn: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeJoined: { backgroundColor: '#DCFCE7' },
  badgeJoinedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  emptySlotCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 14, marginBottom: 12 },
  slotCardFull: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderStyle: 'solid' },
  emptySlotText: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
  inviteResponseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  acceptInviteBtn: { flex: 0.6, backgroundColor: '#10B981', marginRight: 8 },
  declineInviteBtn: { flex: 0.38, backgroundColor: '#EF4444' },
  actionButton: { backgroundColor: '#F04E23', flexDirection: 'row', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionButtonConfirmed: { backgroundColor: '#10B981' }, 
  actionButtonDisabled: { backgroundColor: '#9CA3AF' }, 
  actionButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  inviteButton: { backgroundColor: '#F04E23', flexDirection: 'row', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  inviteButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});