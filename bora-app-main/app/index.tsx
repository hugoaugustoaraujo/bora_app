// app/index.tsx
import React, { useState } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { loginUser } from '../src/services/api';

export default function LoginScreen() {
  const { updateUserProfile } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      
      // Chamada HTTP real para a rota POST /api/login do Node.js
      const userData = await loginUser(email.trim(), password);

      // Atualiza o perfil no contexto global com os dados retornados do PostgreSQL
      if (updateUserProfile) {
        updateUserProfile({
          id: userData.id,
          name: userData.name,
          username: userData.username,
          location: userData.location_name,
          bio: userData.bio,
          avatarUrl: userData.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        });
      }

      // Redireciona para as abas principais
      router.replace('/(tabs)/tela-inicio' as any);
    } catch (error: any) {
      console.error('Erro no login:', error);
      Alert.alert('Falha no Login', error.message || 'E-mail ou palavra-passe incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconBox}>
            {/* Ícone de seta apontando para a direita superior */}
            <FontAwesome name="arrow-up" size={32} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
          <Text style={styles.appName}>Bora?</Text>
          <Text style={styles.tagline}>Do amistoso ao competitivo, jogue junto.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'A entrar...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register' as any)}
          >
            <Text style={styles.registerLinkText}>
              Ainda não tem conta? <Text style={styles.registerHighlight}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#F04E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', letterSpacing: -1 },
  tagline: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  formContainer: { width: '100%' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 12 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  loginButton: { backgroundColor: '#F04E23', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#F04E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  loginButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerLinkText: { fontSize: 13, color: '#6B7280' },
  registerHighlight: { color: '#F04E23', fontWeight: 'bold' },
});