// app/map-view.tsx
import React, { useState, useEffect, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import * as Location from 'expo-location';

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

// Função auxiliar para calcular a distância em quilômetros entre dois pontos (Fórmula de Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
};

export default function MapViewScreen() {
  const { matches, isDarkMode } = useApp();
  const [radius, setRadius] = useState('3 km');
  
  const [userLocation, setUserLocation] = useState({
    latitude: -9.6658,
    longitude: -35.7353,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });

  const radiusKmMap: Record<string, number> = {
    '1 km': 1,
    '3 km': 3,
    '5 km': 5,
    '10 km': 10,
    '20 km': 20,
  };

  const radiusDeltaMap: Record<string, number> = {
    '1 km': 0.01,
    '3 km': 0.03,
    '5 km': 0.05,
    '10 km': 0.10,
    '20 km': 0.20,
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

  const requestUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da permissão de localização para exibir o mapa.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      setUserLocation((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));
    } catch (error) {
      console.error('Erro ao obter geolocalização:', error);
    }
  };

  const handleSelectRadius = (r: string) => {
    setRadius(r);
    const delta = radiusDeltaMap[r] || 0.03;
    setUserLocation((prev) => ({
      ...prev,
      latitudeDelta: delta,
      longitudeDelta: delta,
    }));
  };

  const radii = ['1 km', '3 km', '5 km', '10 km', '20 km'];

  const maxRadiusKm = radiusKmMap[radius] || 3;

  // Filtra as partidas pelo raio e adiciona o cálculo de distância formatado
  const filteredMatches = (matches || [])
    .map((m: any) => {
      if (!m.latitude || !m.longitude) return null;
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        Number(m.latitude),
        Number(m.longitude)
      );
      return { ...m, distanceKm: dist };
    })
    .filter((m: any) => m !== null && m.distanceKm <= maxRadiusKm)
    .sort((a: any, b: any) => a.distanceKm - b.distanceKm); // Ordena da mais próxima para a mais distante

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

        var matches = ${JSON.stringify(filteredMatches)};
        matches.forEach(function(m) {
          L.marker([m.latitude, m.longitude]).addTo(map)
            .bindPopup('<b>' + m.title + '</b><br/>' + (m.locationOrPlatform || '') + '<br/><i>' + m.distanceKm.toFixed(1) + ' km de você</i>');
        });
      </script>
    </body>
    </html>
  `;

  const theme = {
    bg: isDarkMode ? '#121212' : '#FAFAFA',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#6B7280',
    border: isDarkMode ? '#2E2E2E' : '#E5E7EB',
  };

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
        <Text style={[styles.navTitle, { color: theme.text }]}>Mapa de Partidas</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={[styles.updateLocationBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={requestUserLocation}>
          <Ionicons name="locate" size={16} color="#F04E23" style={{ marginRight: 6 }} />
          <Text style={styles.updateLocationText}>Atualizar localização</Text>
        </TouchableOpacity>

        <Text style={[styles.radiusLabel, { color: theme.text }]}>Raio de distância - {radius}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusScroll}>
          {radii.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusChip, 
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                radius === r && styles.radiusChipActive
              ]}
              onPress={() => handleSelectRadius(r)}
            >
              <Text style={[styles.radiusChipText, { color: theme.subText }, radius === r && styles.radiusChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mapa */}
        <View style={[styles.mapContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {Platform.OS !== 'web' && MapView ? (
            <MapView
              style={styles.mapView}
              region={userLocation}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                title="A sua localização"
                description="Você está aqui"
              >
                <View style={styles.mapPinIconBox}>
                  <FontAwesome name="arrow-up" size={14} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </Marker>

              {filteredMatches.map((m: any) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: Number(m.latitude), longitude: Number(m.longitude) }}
                  title={m.title}
                  description={`${m.locationOrPlatform || ''} (${m.distanceKm.toFixed(1)} km)`}
                />
              ))}
            </MapView>
          ) : (
            createElement('iframe', {
              srcDoc: interactiveLeafletHtml,
              style: { width: '100%', height: '100%', border: 0 },
            })
          )}
        </View>

        {/* Lista de Partidas encontradas dentro do raio */}
        <View style={[styles.footerInfoBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.footerInfoTitle, { color: theme.text }]}>
            Partidas dentro de {radius} ({filteredMatches.length})
          </Text>
          
          {filteredMatches.length > 0 ? (
            filteredMatches.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.matchCardMini, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA', borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/match-details', params: { matchId: item.id } } as any)}
              >
                <View style={styles.matchCardTop}>
                  <View style={styles.iconBox}>
                    <FontAwesome name="arrow-up" size={14} color="#F04E23" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.matchTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.matchCategory, { color: theme.subText }]}>{item.locationOrPlatform || item.category}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyTextMini, { color: theme.subText }]}>
              Nenhuma partida encontrada em um raio de {radius}.
            </Text>
          )}
        </View>

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
  updateLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingVertical: 10, borderRadius: 12, marginBottom: 14 },
  updateLocationText: { fontSize: 13, fontWeight: 'bold', color: '#F04E23' },
  radiusLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  radiusScroll: { flexDirection: 'row', marginBottom: 14, maxHeight: 40 },
  radiusChip: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8, height: 36, justifyContent: 'center' },
  radiusChipActive: { backgroundColor: '#F04E23', borderColor: '#F04E23' },
  radiusChipText: { fontSize: 12, fontWeight: '600' },
  radiusChipTextActive: { color: '#FFF' },
  mapContainer: { height: 260, borderRadius: 20, position: 'relative', overflow: 'hidden', borderWidth: 1, marginBottom: 16 },
  mapView: { width: '100%', height: '100%' },
  mapPinIconBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  footerInfoBox: { borderWidth: 1, borderRadius: 16, padding: 14 },
  footerInfoTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  matchCardMini: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  matchCardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center' },
  matchTitle: { fontSize: 13, fontWeight: 'bold' },
  matchCategory: { fontSize: 11, marginTop: 1 },
  distanceBadge: { backgroundColor: '#FFF0ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distanceText: { fontSize: 11, fontWeight: 'bold', color: '#F04E23' },
  emptyTextMini: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginVertical: 8 },
});