import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { api } from '../src/services/api';

export default function AccountInfoScreen() {
  const { userProfile } = useApp();
  const [accountData, setAccountData] = useState<any>(userProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!userProfile?.id) return;
      try {
        // Busca os dados atualizados diretamente da base de dados do utilizador
        const response = await api.get(`/users/${userProfile.id}`);
        setAccountData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados da conta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [userProfile?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Informações da Conta</Text>
          <View style={{ width: 36 }} />
        </View>
        <ActivityIndicator size="large" color="#F04E23" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Informações da Conta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <Text style={styles.value}>{accountData?.name || 'Não informado'}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>NOME DE UTILIZADOR</Text>
          <Text style={styles.value}>{accountData?.username || 'Não informado'}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>ENDEREÇO DE E-MAIL</Text>
          <Text style={styles.value}>{accountData?.email || 'Não informado'}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <Text style={styles.value}>{accountData?.location_name || accountData?.location || 'Maceió, AL'}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>BIOGRAFIA</Text>
          <Text style={styles.value}>{accountData?.bio || 'Sem biografia definida.'}</Text>
        </View>
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
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 20 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#888', letterSpacing: 1 },
  value: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginTop: 4, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
});