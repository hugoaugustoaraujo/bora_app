import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function SettingsScreen() {
  const { userProfile, updateUserSettings, isDarkMode } = useApp();

  const [privateProfile, setPrivateProfile] = useState(userProfile?.is_private || false);
  const [pushNotifications, setPushNotifications] = useState(userProfile?.push_notifications ?? true);
  const [emailAlerts, setEmailAlerts] = useState(userProfile?.email_alerts || false);
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    if (userProfile) {
      setPrivateProfile(userProfile.is_private || false);
      setPushNotifications(userProfile.push_notifications ?? true);
      setEmailAlerts(userProfile.email_alerts || false);
      setDarkMode(userProfile.dark_mode || false);
    }
  }, [userProfile]);

  const handleTogglePrivate = async (val: boolean) => {
    setPrivateProfile(val);
    await updateUserSettings({ is_private: val });
  };

  const handleTogglePush = async (val: boolean) => {
    setPushNotifications(val);
    await updateUserSettings({ push_notifications: val });
  };

  const handleToggleEmail = async (val: boolean) => {
    setEmailAlerts(val);
    await updateUserSettings({ email_alerts: val });
  };

  const handleToggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    await updateUserSettings({ dark_mode: val });
  };

  // Cores dinâmicas para o Dark Mode
  const dynamicStyles = {
    bg: darkMode ? '#121212' : '#FAFAFA',
    cardBg: darkMode ? '#1E1E1E' : '#FFF',
    text: darkMode ? '#FFFFFF' : '#1A1A1A',
    subText: darkMode ? '#AAAAAA' : '#6B7280',
    border: darkMode ? '#2E2E2E' : '#E5E7EB',
    divider: darkMode ? '#2A2A2A' : '#F3F4F6',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicStyles.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={dynamicStyles.bg} />

      {/* Barra Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={dynamicStyles.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: dynamicStyles.text }]}>Configurações</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECÇÃO: CONTA E PRIVACIDADE */}
        <Text style={[styles.sectionHeader, { color: dynamicStyles.subText }]}>CONTA E PRIVACIDADE</Text>
        <View style={[styles.cardSection, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.border }]}>
          
          {/* 1. Informações da Conta */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/account-info' as any)}
          >
            <View style={styles.settingItemLeft}>
              <Feather name="user" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Informações da Conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: dynamicStyles.divider }]} />

          {/* 2. Perfil Privado */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Feather name="lock" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Perfil Privado</Text>
            </View>
            <Switch
              value={privateProfile}
              onValueChange={handleTogglePrivate}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={privateProfile ? '#F04E23' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* SECÇÃO: NOTIFICAÇÕES E ALERTAS */}
        <Text style={[styles.sectionHeader, { color: dynamicStyles.subText }]}>NOTIFICAÇÕES E ALERTAS</Text>
        <View style={[styles.cardSection, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.border }]}>
          
          {/* 3. Notificações Push */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="notifications-outline" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Notificações Push</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={pushNotifications ? '#F04E23' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicStyles.divider }]} />

          {/* 4. Alertas por E-mail */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Feather name="mail" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Alertas por E-mail</Text>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={handleToggleEmail}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={emailAlerts ? '#F04E23' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* SECÇÃO: PREFERÊNCIAS */}
        <Text style={[styles.sectionHeader, { color: dynamicStyles.subText }]}>PREFERÊNCIAS</Text>
        <View style={[styles.cardSection, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.border }]}>
          
          {/* 5. Modo Escuro (Dark Mode) */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Feather name="moon" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Modo Escuro (Dark Mode)</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={darkMode ? '#F04E23' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicStyles.divider }]} />

          {/* 6. Utilizadores Bloqueados */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/blocked-users' as any)}
          >
            <View style={styles.settingItemLeft}>
              <Feather name="slash" size={18} color="#DC2626" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: '#DC2626' }]}>Utilizadores Bloqueados</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* SECÇÃO: SOBRE E SUPORTE */}
        <Text style={[styles.sectionHeader, { color: dynamicStyles.subText }]}>SOBRE E SUPORTE</Text>
        <View style={[styles.cardSection, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.border }]}>
          
          {/* 7. Central de Ajuda */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help-center' as any)}
          >
            <View style={styles.settingItemLeft}>
              <Feather name="help-circle" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Central de Ajuda</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: dynamicStyles.divider }]} />

          {/* 8. Termos e Políticas */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/terms-policies' as any)}
          >
            <View style={styles.settingItemLeft}>
              <Feather name="info" size={18} color="#F04E23" style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: dynamicStyles.text }]}>Termos e Políticas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  cardSection: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 16 },
});