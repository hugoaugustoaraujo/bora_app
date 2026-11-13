import React, { useState, createElement } from 'react';
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
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { registerUser } from '../src/services/api';

// Importação condicional do seletor de calendário para mobile
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.log('DateTimePicker não disponível no ambiente atual.');
  }
}

export default function RegisterScreen() {
  const { updateUserProfile } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationName, setLocationName] = useState('Maceió, AL');
  
  const [birthDate, setBirthDate] = useState<Date>(() => new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!username) {
      const generated = text.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(generated);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatLocalDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '2000-01-01';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o seu nome, @username, e-mail e senha.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro na Senha', 'As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Senha Curta', 'A senha deve conter ao menos 8 caracteres.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Termos de Uso', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    try {
      setLoading(true);

      const formattedDateBirth = formatLocalDate(birthDate);

      const payload = {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email.trim().toLowerCase(),
        password_hash: password,
        location_name: locationName.trim(),
        birth_date: formattedDateBirth,
        bio: 'Membro do Bora',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      };

      console.log('📤 [DISPARO] Enviando dados de cadastro:', payload);

      const newUser = await registerUser(payload);

      if (updateUserProfile && newUser) {
        updateUserProfile({
          id: newUser.id,
          name: newUser.name,
          username: `@${newUser.username}`,
          email: newUser.email,
          location: newUser.location_name,
          bio: newUser.bio,
          avatarUrl: newUser.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        });
      }

      Alert.alert('Sucesso! 🎉', 'Sua conta foi criada com sucesso!');
      router.replace('/(tabs)/tela-inicio' as any);
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      Alert.alert('Falha no Cadastro', error.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconBox}>
              <FontAwesome name="arrow-up" size={14} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
            <Text style={styles.logoText}>bora</Text>
          </View>
        </View>

        <View style={styles.badgeContainer}>
          <Ionicons name="people-outline" size={14} color="#F04E23" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>Tem lugar no time pra você</Text>
        </View>

        <Text style={styles.mainTitle}>Bora fazer parte?</Text>
        <Text style={styles.mainSubtitle}>
          Preencha os seus dados de cadastro para salvar seu perfil na plataforma.
        </Text>

        <View style={styles.formContainer}>
          
          <Text style={styles.inputLabel}>Nome completo</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="Como você se chama?"
              placeholderTextColor="#A0A0A0"
              value={name}
              onChangeText={setName}
            />
            <Ionicons name="person-outline" size={18} color="#888" />
          </View>

          <Text style={styles.inputLabel}>Nome de usuário (@username)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="ex: usuario1"
              placeholderTextColor="#A0A0A0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Ionicons name="at-outline" size={18} color="#888" />
          </View>

          <Text style={styles.inputLabel}>E-mail</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="voce@exemplo.com"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Ionicons name="mail-outline" size={18} color="#888" />
          </View>

          <Text style={styles.inputLabel}>Data de nascimento</Text>
          {Platform.OS === 'web' ? (
            <View style={styles.inputBox}>
              {createElement('input', {
                type: 'date',
                value: formatLocalDate(birthDate),
                onChange: (e: any) => setBirthDate(new Date(e.target.value)),
                style: {
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                  color: '#1A1A1A',
                }
              })}
              <Ionicons name="calendar-outline" size={18} color="#888" />
            </View>
          ) : (
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.inputField, { lineHeight: 48 }]}>
                {birthDate.toLocaleDateString('pt-BR')}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#888" />
            </TouchableOpacity>
          )}

          {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.inputLabel}>Cidade / Localização</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="ex: Maceió, AL"
              placeholderTextColor="#A0A0A0"
              value={locationName}
              onChangeText={setLocationName}
            />
            <Ionicons name="location-outline" size={18} color="#888" />
          </View>

          <Text style={styles.inputLabel}>Senha</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="Crie uma senha"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#888" />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Use ao menos 8 caracteres, letras e números.</Text>

          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Confirmar senha</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.inputField}
              placeholder="Digite sua senha novamente"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#888" />
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.termsRow}>
          <TouchableOpacity 
            style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} 
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            {acceptedTerms && <FontAwesome name="check" size={10} color="#FFF" />}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            Li e aceito os{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/terms-policies' as any)}>
              Termos de Uso
            </Text>{' '}
            e a{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/terms-policies' as any)}>
              Política de Privacidade
            </Text>{' '}
            do Bora.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.7 }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'A criar conta...' : 'Criar minha conta'}</Text>
          <FontAwesome name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Já está no time? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Entrar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIconBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#F04E23', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', letterSpacing: -0.5 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#F04E23' },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6 },
  mainSubtitle: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 20 },
  formContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  inputField: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  helperText: { fontSize: 10, color: '#888', marginTop: -8, marginBottom: 6, marginLeft: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingRight: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1 },
  checkboxChecked: { backgroundColor: '#F04E23', borderColor: '#F04E23' },
  termsText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 16 },
  termsLink: { color: '#F04E23', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#F04E23', flexDirection: 'row', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#F04E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 12, color: '#666' },
  footerLink: { fontSize: 12, color: '#F04E23', fontWeight: 'bold' },
});