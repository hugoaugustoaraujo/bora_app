// app/(tabs)/matches.tsx
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';

export default function MatchesScreen() {
  const { matches, userProfile, loadMatches, loadFriends } = useApp();
  const [loading, setLoading] = React.useState(false);

  // ==========================================
  // GATILHO DE ATUALIZAÇÃO EM TEMPO REAL (Polling)
  // ==========================================
  useEffect(() => {
    if (userProfile?.id) {
      loadMatches(userProfile.id);
      loadFriends(userProfile.id);

      // Atualiza a lista de partidas constantemente a cada 4 segundos em segundo plano
      const interval = setInterval(() => {
        loadMatches(userProfile.id);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [userProfile?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Partidas</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/create-match' as any)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createBtnText}>Criar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Explore partidas presenciais abertas e entre para jogar!</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#F04E23" style={{ marginTop: 40 }} />
        ) : (!matches || matches.length === 0) ? (
          <Text style={styles.emptyText}>Nenhuma partida encontrada no momento.</Text>
        ) : (
          matches.map((item) => {
            const isPendingInvite = item.participantStatus === 'pending';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.matchCard, isPendingInvite && styles.matchCardPending]}
                onPress={() => router.push({ pathname: '/match-details', params: { matchId: item.id } } as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <FontAwesome name="arrow-up" size={16} color="#F04E23" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.matchTitle}>{item.title}</Text>
                    <Text style={styles.matchCategory}>{item.category}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>Presencial</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{item.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{item.locationOrPlatform}</Text>
                  </View>
                </View>

                {/* Exibição do Status de Convite Pendente */}
                {isPendingInvite && (
                  <View style={styles.pendingBadgeRow}>
                    <Ionicons name="mail-unread-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.pendingBadgeText}>Status: Convite Pendente</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.vacanciesText}>
                    {item.vacancies} vagas disponíveis ({item.totalSpots - item.vacancies}/{item.totalSpots})
                  </Text>
                  <Text style={styles.linkText}>Ver detalhes →</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F04E23', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 13 },
  matchCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 14, marginBottom: 12 },
  matchCardPending: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center' },
  matchTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  matchCategory: { fontSize: 11, color: '#888', marginTop: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FFF0ED' },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#F04E23' },
  cardDetails: { marginBottom: 10, paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  detailText: { fontSize: 12, color: '#4B5563' },
  pendingBadgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 10 },
  pendingBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#D97706' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vacanciesText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  linkText: { fontSize: 12, fontWeight: 'bold', color: '#F04E23' },
});