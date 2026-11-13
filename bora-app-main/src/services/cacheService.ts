// src/services/cacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves de Armazenamento
const USER_KEY = '@bora_user_profile';
const MATCHES_KEY = '@bora_confirmed_matches';
const LOCATION_KEY = '@bora_last_location';
const CHATS_KEY = '@bora_chats_history';
const FRIEND_REQUESTS_KEY = '@bora_friend_requests';
const FRIENDS_KEY = '@bora_offline_friends';
const NOTIFICATIONS_KEY = '@bora_notifications';
const PREFERENCES_KEY = '@bora_user_preferences';
const SYNC_QUEUE_KEY = '@bora_sync_queue';
const AVATAR_CACHE_KEY = '@bora_user_avatar_cache';

export interface LocationData {
  latitude: number;
  longitude: number;
  location_name?: string;
  updated_at: string;
}

export interface ChatMessage {
  id?: string | number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  created_at: string;
  status?: 'pending' | 'sent' | 'read';
}

export interface SyncAction {
  id: string;
  type: 'SEND_MESSAGE' | 'UPDATE_PROFILE' | 'UPDATE_LOCATION' | 'ACCEPT_FRIEND_REQUEST' | 'TOGGLE_MATCH_PRESENCE';
  payload: any;
  timestamp: number;
}

export const cacheService = {
  // ==========================================
  // 1. DADOS DO UTILIZADOR E AVATAR
  // ==========================================
  async saveUser(user: any) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      if (user?.avatar_url) {
        await this.saveAvatar(user.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao salvar utilizador no cache:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao recuperar utilizador do cache:', error);
      return null;
    }
  },

  async saveAvatar(avatarUrl: string) {
    try {
      await AsyncStorage.setItem(AVATAR_CACHE_KEY, avatarUrl);
    } catch (error) {
      console.error('Erro ao salvar avatar no cache:', error);
    }
  },

  async getAvatar(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AVATAR_CACHE_KEY);
    } catch (error) {
      console.error('Erro ao buscar avatar no cache:', error);
      return null;
    }
  },

  // ==========================================
  // 2. PARTIDAS CONFIRMADAS E LISTAGEM
  // ==========================================
  async saveConfirmedMatches(matches: any[]) {
    try {
      await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    } catch (error) {
      console.error('Erro ao salvar partidas no cache:', error);
    }
  },

  async getConfirmedMatches(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(MATCHES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao recuperar partidas do cache:', error);
      return [];
    }
  },

  // ==========================================
  // 3. GEOLOCALIZAÇÃO
  // ==========================================
  async saveLocation(location: LocationData) {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Erro ao salvar localização no cache:', error);
    }
  },

  async getLocation(): Promise<LocationData | null> {
    try {
      const data = await AsyncStorage.getItem(LOCATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao recuperar localização do cache:', error);
      return null;
    }
  },

  // ==========================================
  // 4. MENSAGENS E CONVERSAS (OFFLINE E ONLINE)
  // ==========================================
  async saveChats(chatsData: Record<string, ChatMessage[]>) {
    try {
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chatsData));
    } catch (error) {
      console.error('Erro ao salvar conversas no cache:', error);
    }
  },

  async getChats(): Promise<Record<string, ChatMessage[]>> {
    try {
      const data = await AsyncStorage.getItem(CHATS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao recuperar conversas do cache:', error);
      return {};
    }
  },

  async getChatWithUser(friendId: string | number): Promise<ChatMessage[]> {
    try {
      const chats = await this.getChats();
      return chats[String(friendId)] || [];
    } catch (error) {
      return [];
    }
  },

  async addOfflineMessage(friendId: string | number, message: ChatMessage) {
    try {
      const chats = await this.getChats();
      const key = String(friendId);
      if (!chats[key]) chats[key] = [];

      chats[key].push({ ...message, status: 'pending' });
      await this.saveChats(chats);

      await this.addToSyncQueue({
        id: `msg_${Date.now()}_${Math.random()}`,
        type: 'SEND_MESSAGE',
        payload: message,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao registrar mensagem offline:', error);
    }
  },

  // ==========================================
  // 5. AMIGOS E SOLICITAÇÕES DE AMIZADE
  // ==========================================
  async saveFriends(friends: any[]) {
    try {
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    } catch (error) {
      console.error('Erro ao salvar amigos no cache:', error);
    }
  },

  async getFriends(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(FRIENDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async saveFriendRequests(requests: { sent: any[]; received: any[] }) {
    try {
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Erro ao salvar solicitações no cache:', error);
    }
  },

  async getFriendRequests(): Promise<{ sent: any[]; received: any[] }> {
    try {
      const data = await AsyncStorage.getItem(FRIEND_REQUESTS_KEY);
      return data ? JSON.parse(data) : { sent: [], received: [] };
    } catch (error) {
      return { sent: [], received: [] };
    }
  },

  // ==========================================
  // 6. NOTIFICAÇÕES E PREFERÊNCIAS
  // ==========================================
  async saveNotifications(notifications: any[]) {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Erro ao salvar notificações no cache:', error);
    }
  },

  async getNotifications(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async savePreferences(preferences: Record<string, any>) {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Erro ao salvar preferências no cache:', error);
    }
  },

  async getPreferences(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  },

  // ==========================================
  // 7. FILA DE SINCRONIZAÇÃO OFFLINE
  // ==========================================
  async addToSyncQueue(action: SyncAction) {
    try {
      const queue = await this.getSyncQueue();
      queue.push(action);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Erro ao adicionar à fila de sincronização:', error);
    }
  },

  async getSyncQueue(): Promise<SyncAction[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async clearSyncQueue() {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Erro ao limpar fila de sincronização:', error);
    }
  },

  // ==========================================
  // 8. LOGOUT E LIMPEZA
  // ==========================================
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        USER_KEY,
        MATCHES_KEY,
        LOCATION_KEY,
        CHATS_KEY,
        FRIEND_REQUESTS_KEY,
        FRIENDS_KEY,
        NOTIFICATIONS_KEY,
        PREFERENCES_KEY,
        SYNC_QUEUE_KEY,
        AVATAR_CACHE_KEY,
      ]);
    } catch (error) {
      console.error('Erro ao limpar todo o cache:', error);
    }
  },
};