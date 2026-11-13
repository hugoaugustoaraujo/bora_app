import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PresencialMatchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Barra Superior / Navegação */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Partida presencial</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-horizontal" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho da Partida Presencial */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Modalidade</Text>
              <Text style={styles.infoMainValue}>Vôlei</Text>
              <Text style={styles.infoSubValue}>Na quadra</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Categoria</Text>
              <Text style={styles.infoMainValue}>Recreativo</Text>
              <Text style={styles.infoSubValue}>Misto · 3 × 3</Text>
            </View>
          </View>

          {/* Ícone da Modalidade */}
          <View style={styles.sportIconBox}>
            <MaterialCommunityIcons name="volleyball" size={24} color="#F04E23" />
          </View>
        </View>

        {/* Card de Data, Horário e Local */}
        <TouchableOpacity style={styles.locationCard}>
          <View style={styles.locationIconBox}>
            <Ionicons name="location" size={20} color="#F04E23" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Hoje, 8 out. · 19h às 20h</Text>
            <Text style={styles.locationSub}>Quadras do Ibirapuera · 1,2 km</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#F04E23" />
        </TouchableOpacity>

        {/* Seção Quem Vai Jogar */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quem vai jogar</Text>
            <Text style={styles.sectionCounter}>4 de 6 confirmados</Text>
          </View>

          {/* Lucas (Criador) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Lucas · você</Text>
              <Text style={styles.memberRole}>Organizador da partida</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusBadge, styles.badgeCreator]}>
                <Text style={styles.badgeCreatorText}>Criador</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Bia (Entrou) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Bia</Text>
              <Text style={styles.memberRole}>Sua amiga · entrou na partida</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusBadge, styles.badgeJoined]}>
                <Text style={styles.badgeJoinedText}>Entrou</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Rafa (Aceitou) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Rafa</Text>
              <Text style={styles.memberRole}>Convidado por você · aceitou</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusBadge, styles.badgeAccepted]}>
                <Text style={styles.badgeAcceptedText}>Aceitou</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Pedro (Entrou) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Pedro</Text>
              <Text style={styles.memberRole}>Seu amigo · entrou na partida</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusBadge, styles.badgeJoined]}>
                <Text style={styles.badgeJoinedText}>Entrou</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Slot de Vagas Restantes na Quadra */}
          <View style={styles.emptySlotCard}>
            <Feather name="plus" size={16} color="#F04E23" />
            <Text style={styles.emptySlotText}>Ainda cabem 2 na quadra. Bora chamar?</Text>
          </View>

          {/* Opção Amigos Podem Entrar */}
          <TouchableOpacity style={styles.friendsAllowedCard}>
            <View style={styles.friendsIconBox}>
              <Ionicons name="people-outline" size={18} color="#4B5563" />
            </View>
            <View style={styles.friendsAllowedInfo}>
              <Text style={styles.friendsAllowedTitle}>Amigos podem entrar</Text>
              <Text style={styles.friendsAllowedSub}>Seus amigos podem ocupar as vagas livres.</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

        </View>

        {/* Botão Convidar Amigos */}
        <TouchableOpacity style={styles.inviteButton}>
          <Ionicons name="person-add-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.inviteButtonText}>Convidar amigos</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  infoGroup: { alignItems: 'flex-start' },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoMainValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  infoSubValue: { fontSize: 11, color: '#888', marginTop: 2 },
  sportIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', padding: 14, borderRadius: 16, marginBottom: 24 },
  locationIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  locationInfo: { flex: 1 },
  locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  locationSub: { fontSize: 11, color: '#888', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  sectionCounter: { fontSize: 12, color: '#888' },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  memberRole: { fontSize: 11, color: '#888', marginTop: 2 },
  badgeColumn: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  badgeCreator: { backgroundColor: '#FFF0ED' },
  badgeCreatorText: { fontSize: 10, fontWeight: 'bold', color: '#F04E23' },
  badgeJoined: { backgroundColor: '#DCFCE7' },
  badgeJoinedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  badgeAccepted: { backgroundColor: '#DCFCE7' },
  badgeAcceptedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  presenceText: { fontSize: 10, color: '#6B7280' },
  emptySlotCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 14, marginBottom: 12, backgroundColor: '#FAFAFA' },
  emptySlotText: { fontSize: 12, color: '#888', marginLeft: 6, fontWeight: '500' },
  friendsAllowedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 14, borderRadius: 16, marginBottom: 12 },
  friendsIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  friendsAllowedInfo: { flex: 1 },
  friendsAllowedTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  friendsAllowedSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  inviteButton: { backgroundColor: '#F04E23', flexDirection: 'row', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#F04E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  inviteButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});