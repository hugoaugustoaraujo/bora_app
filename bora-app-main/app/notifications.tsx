import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { api } from '../src/services/api';

interface Notification {
  id: string;
  type: 'chat_message' | 'match_created_friend' | 'match_joined_friend';
  actorId?: string;
  actorName: string;
  actorAvatar: string;
  referenceId: number;
  messageId?: number;
  notificationText: string;
  isRead: boolean;
  timeAgo: string;
}

export default function NotificationsScreen() {
  const { userProfile } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!userProfile?.id) return;
    try {
      const response = await api.get(`/users/${userProfile.id}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userProfile?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const renderNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'chat_message':
        return <Ionicons name="chatbubble-outline" size={18} color="#F04E23" />;
      case 'match_created_friend':
        return <Feather name="plus-circle" size={18} color="#10B981" />;
      case 'match_joined_friend':
        return <MaterialCommunityIcons name="volleyball" size={18} color="#F04E23" />;
      default:
        return <Ionicons name="notifications-outline" size={18} color="#888" />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.type === 'chat_message' && notification.actorId) {
      router.push({
        pathname: '/chat/[friendId]',
        params: { friendId: notification.actorId },
      } as any);
    } else if (notification.referenceId) {
      router.push({
        pathname: '/match-details',
        params: { matchId: notification.referenceId.toString() },
      } as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F04E23" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Barra Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Notificações</Text>
        <TouchableOpacity style={styles.iconButton} onPress={loadNotifications}>
          <Feather name="refresh-cw" size={16} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#E5E7EB" />
            <Text style={styles.emptyText}>Você não tem novas notificações.</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity 
              key={notif.id} 
              style={[styles.notifCard, !notif.isRead && styles.notifUnreadCard]}
              onPress={() => handleNotificationPress(notif)}
            >
              <View style={styles.notifHeader}>
                <Image source={{ uri: notif.actorAvatar }} style={styles.actorAvatar} />
                <View style={styles.notifDetails}>
                  <Text style={styles.notifText}>{notif.notificationText}</Text>
                  <Text style={styles.notifTime}>{notif.timeAgo}</Text>
                </View>
                <View style={styles.iconBox}>{renderNotificationIcon(notif.type)}</View>
              </View>
              {!notif.isRead && (
                <TouchableOpacity 
                  style={styles.markReadBtn} 
                  onPress={() => handleMarkAsRead(notif.id)}
                >
                  <Text style={styles.markReadText}>Marcar como lida</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 16 },
  notifCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 14, marginBottom: 12 },
  notifUnreadCard: { borderColor: '#FCA5A5', backgroundColor: '#FFF0ED' },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  actorAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12 },
  notifDetails: { flex: 1 },
  notifText: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  notifTime: { fontSize: 10, color: '#888', marginTop: 2 },
  iconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFF0ED', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  markReadBtn: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8 },
  markReadText: { fontSize: 11, fontWeight: 'bold', color: '#F04E23' },
});