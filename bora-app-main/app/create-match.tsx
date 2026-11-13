// app/create-match.tsx
import React, { useState, useEffect, createElement, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

// Importação condicional segura para mobile (react-native-maps)
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

export default function CreateMatchScreen() {
  const { addMatch, userProfile, loadMatches, isDarkMode } = useApp();

  const now = useMemo(() => new Date(), []);
  const oneHourAhead = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000), [now]);

  const [category, setCategory] = useState('Esportes');
  const [modalidade, setModalidade] = useState('Vôlei');
  const [selectedGameModes, setSelectedGameModes] = useState<string[]>(['Recreativo', 'Misto']);
  const [matchName, setMatchName] = useState('Vôlei de quadra animado');
  
  const [date, setDate] = useState(oneHourAhead.toISOString().split('T')[0]);
  const [time, setTime] = useState(
    oneHourAhead.toTimeString().split(':').slice(0, 2).join(':')
  );

  const [location, setLocation] = useState('Quadra do bairro');
  const [participantsCount, setParticipantsCount] = useState(8);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  // Coordenadas selecionadas para a partida com fallback seguro
  const [matchCoords, setMatchCoords] = useState({
    latitude: userProfile?.latitude || -9.6658,
    longitude: userProfile?.longitude || -35.7353,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Comunicação bidirecional otimizada de coordenadas na Web (Leaflet)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MAP_CLICKED') {
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
  }, []);

  const categories = useMemo(() => ['Esportes', 'Jogos de Cartas', 'Jogos de Tabuleiro'], []);
  const modalidadesPorCategoria: Record<string, string[]> = useMemo(() => ({
    Esportes: ['Vôlei', 'Futebol', 'Basquete', 'Beach Tennis', 'Tênis'],
    'Jogos de Cartas': ['Truco', 'Baralho / Pife', 'Canastra', 'Buraco'],
    'Jogos de Tabuleiro': ['Xadrez', 'Damas', 'Banco Imobiliário', 'Catan'],
  }), []);

  const currentModalidades = modalidadesPorCategoria[category] || ['Vôlei'];
  const presencialModesOptions = useMemo(() => ['Recreativo', 'Misto', 'Competitivo', 'Amistoso', 'Iniciante'], []);

  const handleCycleCategory = useCallback(() => {
    const currentIndex = categories.indexOf(category);
    const nextIndex = (currentIndex + 1) % categories.length;
    const nextCat = categories[nextIndex];
    setCategory(nextCat);
    setModalidade(modalidadesPorCategoria[nextCat][0]);
  }, [category, categories, modalidadesPorCategoria]);

  const handleCycleModalidade = useCallback(() => {
    const currentIndex = currentModalidades.indexOf(modalidade);
    const nextIndex = (currentIndex + 1) % currentModalidades.length;
    setModalidade(currentModalidades[nextIndex]);
  }, [currentModalidades, modalidade]);

  const handleToggleGameMode = useCallback((mode: string) => {
    setSelectedGameModes((prev) => {
      if (prev.includes(mode)) {
        if (prev.length > 1) {
          return prev.filter((m) => m !== mode);
        } else {
          Alert.alert('Atenção', 'Selecione pelo menos um modo de jogo.');
          return prev;
        }
      } else {
        return [...prev, mode];
      }
    });
  }, []);

  const handleMapPress = useCallback((e: any) => {
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setMatchCoords((prev) => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    }
  }, []);

  const handleMarkerDragEnd = useCallback((e: any) => {
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setMatchCoords((prev) => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    }
  }, []);

  const handleCreateMatch = async () => {
    if (!matchName.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome da partida.');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Erro', 'Você precisa estar logado para criar uma partida.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      Alert.alert('Erro', 'Não é possível criar partidas para datas anteriores a hoje.');
      return;
    }

    try {
      setLoading(true);

      await addMatch({
        title: matchName.trim(),
        category: category,
        modality: modalidade,
        match_date: `${date} ${time}:00`,
        location_name: location,
        lat: matchCoords.latitude,
        lng: matchCoords.longitude,
        total_spots: participantsCount,
        organizer_id: userProfile.id,
        is_public: isPublic,
      });

      if (loadMatches && userProfile?.id) {
        await loadMatches(userProfile.id);
      }

      Alert.alert('Sucesso!', 'A sua partida foi criada com sucesso.');
      router.back();
    } catch (error: any) {
      console.error('Erro ao publicar partida:', error);
      Alert.alert('Erro', error.message || 'Não foi possível publicar a partida no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const theme = useMemo(() => ({
    bg: isDarkMode ? '#121212' : '#FAFAFA',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#6B7280',
    border: isDarkMode ? '#2E2E2E' : '#E5E7EB',
  }), [isDarkMode]);

  // HTML interativo via Leaflet.js otimizado para Web
  const interactiveLeafletHtml = useMemo(() => `
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

        var marker = L.marker([${matchCoords.latitude}, ${matchCoords.longitude}], {draggable: true}).addTo(map);

        marker.on('dragend', function(event) {
          var position = marker.getLatLng();
          window.parent.postMessage({ type: 'MAP_CLICKED', lat: position.lat, lng: position.lng }, '*');
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.parent.postMessage({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
        });
      </script>
    </body>
    </html>
  `, [matchCoords.latitude, matchCoords.longitude]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Criar partida</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.subtitle, { color: theme.subText }]}>Você organiza. A galera entra. Bora jogar!</Text>

        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Categoria</Text>
            <TouchableOpacity style={[styles.dropdownInput, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={handleCycleCategory}>
              <Text style={[styles.dropdownValue, { color: theme.text }]}>{category}</Text>
              <FontAwesome name="refresh" size={10} color={theme.subText} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Modalidade</Text>
            <TouchableOpacity style={[styles.dropdownInput, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={handleCycleModalidade}>
              <Text style={[styles.dropdownValue, { color: theme.text }]}>{modalidade}</Text>
              <FontAwesome name="refresh" size={10} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: theme.text }]}>Modos de jogo</Text>
        <View style={styles.modesContainer}>
          {presencialModesOptions.map((mode) => {
            const isSelected = selectedGameModes.includes(mode);
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeChip, 
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  isSelected && styles.modeChipActive
                ]}
                onPress={() => handleToggleGameMode(mode)}
              >
                <Text style={[styles.modeChipText, { color: theme.subText }, isSelected && styles.modeChipTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { color: theme.text }]}>Nome da partida</Text>
        <View style={[styles.textInputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TextInput
            style={[styles.textInputField, { color: theme.text }]}
            value={matchName}
            onChangeText={setMatchName}
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Data</Text>
            <View style={[styles.dropdownInput, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={14} color={theme.subText} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.dropdownValue, { color: theme.text, flex: 1 }]}
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Horário</Text>
            <View style={[styles.dropdownInput, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="time-outline" size={14} color={theme.subText} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.dropdownValue, { color: theme.text, flex: 1 }]}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: theme.text }]}>Local (Nome / Endereço)</Text>
        <View style={[styles.textInputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TextInput
            style={[styles.textInputField, { color: theme.text }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Quadra, praça, clube ou endereço"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <Text style={[styles.inputLabel, { color: theme.text }]}>Toque no mapa ou arraste o marcador para o local exato</Text>
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
                  title="Local da Partida"
                  description="Toque no mapa ou arraste para reposicionar"
                  draggable
                  onDragEnd={handleMarkerDragEnd}
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
          <Text style={[styles.mapHintText, { color: theme.subText }]}>
            📍 Lat: {matchCoords.latitude.toFixed(4)} | Lng: {matchCoords.longitude.toFixed(4)}
          </Text>
        </View>

        <Text style={[styles.inputLabel, { color: theme.text }]}>Quantas pessoas vão participar?</Text>
        <View style={[styles.counterBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.counterLeft}>
            <Ionicons name="people-outline" size={16} color={theme.subText} style={{ marginRight: 8 }} />
            <Text style={[styles.counterSubText, { color: theme.subText }]}>Total de {participantsCount} vagas</Text>
          </View>
          <View style={styles.counterControls}>
            <TouchableOpacity
              style={[styles.counterBtn, { backgroundColor: isDarkMode ? '#2E2E2E' : '#F3F4F6' }]}
              onPress={() => setParticipantsCount(Math.max(2, participantsCount - 1))}
            >
              <Feather name="minus" size={14} color={theme.subText} />
            </TouchableOpacity>
            <Text style={[styles.counterNumber, { color: theme.text }]}>{participantsCount}</Text>
            <TouchableOpacity
              style={[styles.counterBtn, styles.counterBtnPlus]}
              onPress={() => setParticipantsCount(participantsCount + 1)}
            >
              <Feather name="plus" size={14} color="#F04E23" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.switchContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.switchTitle, { color: theme.text }]}>Organização Pública</Text>
            <Text style={[styles.switchSub, { color: theme.subText }]}>
              {isPublic ? 'Qualquer utilizador pode entrar direto.' : 'Apenas convidados podem participar.'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#FEE2E2' }}
            thumbColor={isPublic ? '#F04E23' : '#9CA3AF'}
            ios_backgroundColor="#E5E7EB"
            onValueChange={() => setIsPublic(!isPublic)}
            value={isPublic}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.7 }]}
          onPress={handleCreateMatch}
          disabled={loading}
        >
          <Ionicons name="calendar-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.createButtonText}>{loading ? 'A publicar...' : 'Publicar meu convite'}</Text>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  subtitle: { fontSize: 12, marginBottom: 16 },
  rowInputs: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  dropdownInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  dropdownValue: { fontSize: 13, fontWeight: '600' },
  modesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  modeChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  modeChipActive: { backgroundColor: '#FFF0ED', borderColor: '#F04E23' },
  modeChipText: { fontSize: 12, fontWeight: '600' },
  modeChipTextActive: { color: '#F04E23', fontWeight: 'bold' },
  textInputContainer: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46, justifyContent: 'center', marginBottom: 12 },
  textInputField: { fontSize: 13, fontWeight: '600' },
  mapSectionCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  mapPreviewContainer: { height: 180, position: 'relative', overflow: 'hidden' },
  mapView: { width: '100%', height: '100%' },
  mapPinIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  mapHintText: { fontSize: 11, textAlign: 'center', paddingVertical: 8, fontWeight: '600' },
  counterBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 50, marginBottom: 16 },
  counterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  counterSubText: { fontSize: 12 },
  counterControls: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  counterBtnPlus: { backgroundColor: '#FFF0ED' },
  counterNumber: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 12 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  switchTitle: { fontSize: 13, fontWeight: 'bold' },
  switchSub: { fontSize: 11, marginTop: 2 },
  createButton: { backgroundColor: '#F04E23', flexDirection: 'row', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#F04E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3, marginTop: 10 },
  createButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});