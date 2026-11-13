import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TermsPoliciesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Termos e Políticas</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Termos de Uso do Bora</Text>
        <Text style={styles.text}>
          O aplicativo Bora visa conectar entusiastas do esporte para a realização de encontros e partidas presenciais de forma segura e colaborativa.
        </Text>

        <Text style={styles.title}>Política de Privacidade</Text>
        <Text style={styles.text}>
          Respeitamos a sua privacidade. Os seus dados de localização e preferências são utilizados exclusivamente para recomendar partidas próximas e melhorar a sua experiência na plataforma.
        </Text>
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
  title: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginTop: 12, marginBottom: 6 },
  text: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
});