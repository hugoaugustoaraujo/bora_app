import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function EditProfileScreen() {
  const { userProfile, updateUserProfile } = useApp();

  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [location, setLocation] = useState(userProfile.location);
  const [bio, setBio] = useState(userProfile.bio);

  const handleSave = () => {
    updateUserProfile({ name, username, location, bio });
    Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Editar perfil</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Text style={styles.saveHeaderBtnText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Nome</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <Text style={styles.label}>Nome de usuário</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} />
        </View>

        <Text style={styles.label}>Localização</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        </View>

        <Text style={styles.label}>Bio / Apresentação</Text>
        <View style={[styles.inputBox, { height: 90, paddingVertical: 8 }]}>
          <TextInput
            style={[styles.input, { textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveMainBtn} onPress={handleSave}>
          <Text style={styles.saveMainBtnText}>Salvar alterações</Text>
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
  saveHeaderBtnText: { fontSize: 14, fontWeight: 'bold', color: '#F04E23' },
  saveHeaderBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 12 },
  inputBox: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 46, justifyContent: 'center' },
  input: { fontSize: 13, color: '#1A1A1A' },
  saveMainBtn: { backgroundColor: '#F04E23', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  saveMainBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});