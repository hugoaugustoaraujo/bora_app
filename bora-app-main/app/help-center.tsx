import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HelpCenterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Central de Ajuda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Como podemos ajudar?</Text>
        
        <TouchableOpacity style={styles.helpCard} onPress={() => Alert.alert('Partidas', 'Para criar uma partida, vá à aba Início e clique em Organizar uma Partida.')}>
          <Feather name="calendar" size={20} color="#F04E23" style={{ marginRight: 12 }} />
          <Text style={styles.cardText}>Como organizar ou participar de partidas?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpCard} onPress={() => Alert.alert('Amigos', 'Pode procurar utilizadores pelo username na aba Amigos.')}>
          <Feather name="users" size={20} color="#F04E23" style={{ marginRight: 12 }} />
          <Text style={styles.cardText}>Como adicionar novos amigos?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpCard} onPress={() => Alert.alert('Suporte Directo', 'Envie um e-mail para suporte@appbora.com')}>
          <Feather name="mail" size={20} color="#F04E23" style={{ marginRight: 12 }} />
          <Text style={styles.cardText}>Falar com o Suporte Técnico</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  content: { padding: 20 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  helpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardText: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', flex: 1 },
});