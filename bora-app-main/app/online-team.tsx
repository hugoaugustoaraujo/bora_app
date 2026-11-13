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

export default function OnlineTeamScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Topo / Barra de Navegação */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Equipe online</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-horizontal" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Informações Principais da Partida */}
        <View style={styles.statsRow}>
          {/* Jogo */}
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Jogo</Text>
            <Text style={styles.statValue}>VALORANT</Text>
            <Text style={styles.statSub}>PC · servidor BR</Text>
          </View>

          {/* Categoria */}
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Categoria</Text>
            <Text style={styles.statValue}>Competitivo</Text>
            <Text style={styles.statSub}>5 × 5</Text>
          </View>

          {/* Ranque médio */}
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Ranque médio</Text>
            <View style={styles.rankBadgeRow}>
              <Feather name="shield" size={13} color="#F04E23" />
              <Text style={styles.rankValue}>Ouro 2</Text>
            </View>
            <Text style={styles.statSub}>3 confirmados</Text>
          </View>
        </View>

        {/* Card de Data e Horário */}
        <View style={styles.dateCard}>
          <View style={styles.dateIconBox}>
            <Ionicons name="calendar-outline" size={20} color="#F04E23" />
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>Hoje, 8 out. · 21h</Text>
            <Text style={styles.dateSub}>Bora fechar o squad? · cerca de 1h</Text>
          </View>
          <TouchableOpacity style={styles.editIconBtn}>
            <Feather name="edit-2" size={15} color="#F04E23" />
          </TouchableOpacity>
        </View>

        {/* Seção Seu Time */}
        <View style={styles.teamSection}>
          <View style={styles.teamHeaderRow}>
            <Text style={styles.sectionTitle}>Seu time</Text>
            <Text style={styles.sectionCounter}>3 de 5 confirmados</Text>
          </View>

          {/* Card 1: Criador */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Lucas · você</Text>
              <Text style={styles.memberRole}>Organizador da equipe</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusTag, styles.badgeCreator]}>
                <Text style={styles.badgeCreatorText}>Criador</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Card 2: Rafa (Entrou) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Rafa</Text>
              <Text style={styles.memberRole}>Seu amigo · entrou na equipe</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusTag, styles.badgeJoined]}>
                <Text style={styles.badgeJoinedText}>Entrou</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Card 3: Bia (Aceitou) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Bia</Text>
              <Text style={styles.memberRole}>Convidada por você · aceitou</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusTag, styles.badgeAccepted]}>
                <Text style={styles.badgeAcceptedText}>Aceitou</Text>
              </View>
              <Text style={styles.presenceText}>Presença confirmada</Text>
            </View>
          </View>

          {/* Card 4: Pedro (Convidado) */}
          <View style={styles.memberCard}>
            <View style={styles.avatarBox}>
              <FontAwesome name="user" size={18} color="#555" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Pedro</Text>
              <Text style={styles.memberRole}>Seu amigo · convidado por você</Text>
            </View>
            <View style={styles.badgeColumn}>
              <View style={[styles.statusTag, styles.badgeInvited]}>
                <Text style={styles.badgeInvitedText}>Convidado</Text>
              </View>
              <Text style={styles.waitingText}>Aguardando resposta</Text>
            </View>
          </View>

          {/* Slot de Vaga em Aberto */}
          <View style={styles.emptySlotCard}>
            <Feather name="plus" size={16} color="#F04E23" />
            <Text style={styles.emptySlotText}>Mais 1 vaga para completar o time</Text>
          </View>

          {/* Card Amigos podem entrar */}
          <TouchableOpacity style={styles.friendsAllowedCard}>
            <View style={styles.friendsIconBox}>
              <Ionicons name="people-outline" size={18} color="#4B5563" />
            </View>
            <View style={styles.friendsAllowedInfo}>
              <Text style={styles.friendsAllowedTitle}>Amigos podem entrar</Text>
              <Text style={styles.friendsAllowedSub}>Seus amigos entram sem precisar de convite.</Text>
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
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 },
  statColumn: { flex: 1, alignItems: 'flex-start' },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  statSub: { fontSize: 11, color: '#888', marginTop: 2 },
  rankBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  rankValue: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 4 },
  dateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', padding: 14, borderRadius: 16, marginBottom: 24 },
  dateIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dateInfo: { flex: 1 },
  dateTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  dateSub: { fontSize: 11, color: '#888', marginTop: 2 },
  editIconBtn: { padding: 4 },
  teamSection: { marginBottom: 20 },
  teamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  sectionCounter: { fontSize: 12, color: '#888' },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  memberRole: { fontSize: 11, color: '#888', marginTop: 2 },
  badgeColumn: { alignItems: 'flex-end' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  badgeCreator: { backgroundColor: '#FFF0ED' },
  badgeCreatorText: { fontSize: 10, fontWeight: 'bold', color: '#F04E23' },
  badgeJoined: { backgroundColor: '#DCFCE7' },
  badgeJoinedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  badgeAccepted: { backgroundColor: '#DCFCE7' },
  badgeAcceptedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  badgeInvited: { backgroundColor: '#FFF0ED' },
  badgeInvitedText: { fontSize: 10, fontWeight: 'bold', color: '#F04E23' },
  presenceText: { fontSize: 10, color: '#6B7280' },
  waitingText: { fontSize: 10, color: '#9CA3AF' },
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