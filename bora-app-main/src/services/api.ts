// src/services/api.ts
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Define a baseURL dinamicamente:
 * - Na Web: Usa http://localhost:3000/api
 * - No Mobile: Deteta o IP atual da máquina via Expo e usa HTTP local
 */
const getDynamicBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const machineIp = hostUri.split(':')[0];
    return `http://${machineIp}:3000/api`;
  }

  return 'http://10.0.0.187:3000/api';
};

const baseURL = getDynamicBaseURL();
console.log('🔗 [API] Conexão configurada na base:', baseURL);

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Retorna a URL base limpa (sem o sufixo /api) útil para montar caminhos estáticos
 */
export const getBaseServerURL = () => {
  return baseURL.replace('/api', '');
};

/**
 * Formata a URL do Avatar de forma inteligente para garantir compatibilidade 
 * entre o servidor, web e celulares físicos na mesma rede Wi-Fi.
 */
export function getFormattedAvatarUrl(avatarUrl?: string): string {
  const fallbackAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
  
  if (!avatarUrl) {
    return fallbackAvatar;
  }

  // Se já for uma URL externa completa (ex: Unsplash, Google, CDN)
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    if (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1')) {
      return avatarUrl
        .replace(/http:\/\/localhost:\d+/, getBaseServerURL())
        .replace(/https:\/\/localhost:\d+/, getBaseServerURL())
        .replace(/http:\/\/127\.0\.0\.1:\d+/, getBaseServerURL());
    }
    return avatarUrl;
  }

  // Se for um caminho relativo gerado pelo backend, concatena com o IP correto do servidor
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
  return `${getBaseServerURL()}${cleanPath}`;
}

// ==========================================
// 1. AUTENTICAÇÃO E UTILIZADORES
// ==========================================

export async function loginUser(email: string, password_hash: string) {
  try {
    const response = await api.post('/login', { 
      email, 
      password: password_hash 
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro na autenticação:', error);
    throw new Error(error.response?.data?.error || 'Erro ao fazer login');
  }
}

export async function registerUser(userData: {
  name: string;
  username: string;
  email: string;
  password_hash: string;
  location_name?: string;
  birth_date?: string;
  bio?: string;
  avatar_url?: string;
}) {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error: any) {
    console.error('Erro no cadastro de utilizador:', error?.response?.data || error);
    throw new Error(error.response?.data?.error || 'Não foi possível concluir o cadastro.');
  }
}

export async function fetchUserProfile(userId: number | string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil do utilizador:', error);
    throw error;
  }
}

export function getUserAvatarEndpointUrl(userId: number | string): string {
  return `${baseURL}/users/${userId}/avatar`;
}

// ==========================================
// 2. PARTIDAS (MATCHES)
// ==========================================

export async function fetchMatches(userId?: number | string) {
  try {
    const response = await api.get('/matches', {
      params: { userId: userId || null }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    throw error;
  }
}

export async function createMatch(matchData: any) {
  try {
    const response = await api.post('/matches', matchData);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar partida:', error);
    throw new Error(error.response?.data?.error || 'Erro ao criar partida');
  }
}

export async function participateMatch(matchId: number | string, userId: number | string) {
  try {
    const response = await api.post(`/matches/${matchId}/participate`, { userId });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao confirmar presença:', error);
    throw new Error(error.response?.data?.error || 'Erro ao confirmar presença');
  }
}

export async function inviteFriendToMatch(matchId: number | string, friendId: number | string) {
  try {
    const response = await api.post(`/matches/${matchId}/invite`, { friendId });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao enviar convite para partida:', error);
    throw new Error(error.response?.data?.error || 'Erro ao enviar convite');
  }
}

// ==========================================
// 3. AMIGOS E CONEXÕES (INCLUINDO CORRELAÇÃO DE IDS)
// ==========================================

export interface FriendProfile {
  id: string | number;
  name: string;
  username: string;
  avatarUrl: string;
  isOnline?: boolean;
  gameDesc?: string;
}

export async function fetchFriends(userId: number | string) {
  try {
    const response = await api.get(`/users/${userId}/friends`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar lista de amigos:', error);
    throw error;
  }
}

/**
 * Busca a lista de amizades correlacionando o user_id logado com os friend_id da tabela friendships
 * e recupera a foto e os dados atualizados de cada amigo diretamente do backend.
 */
export async function fetchFriendsWithAvatars(currentUserId: string | number): Promise<FriendProfile[]> {
  if (!currentUserId) return [];

  try {
    const response = await api.get(`/users/${currentUserId}/friends`);
    const rawFriends = response.data || [];

    const updatedFriendsPromises = rawFriends.map(async (friend: any) => {
      const friendId = friend.friend_id || friend.friendId || friend.id;

      try {
        const userRes = await api.get(`/users/${friendId}`);
        const userData = userRes.data || friend;

        const rawAvatar = userData.avatar_url || userData.avatarUrl || friend.avatar_url || friend.avatarUrl;
        const avatarUrl = getFormattedAvatarUrl(rawAvatar);

        return {
          id: friendId,
          name: userData.name || friend.name || 'Amigo',
          username: userData.username || friend.username || '',
          avatarUrl: avatarUrl,
          isOnline: Boolean(userData.isOnline ?? friend.isOnline ?? true),
          gameDesc: userData.bio || friend.gameDesc || '',
        };
      } catch (err) {
        const fallbackAvatar = getFormattedAvatarUrl(friend.avatar_url || friend.avatarUrl);
        return {
          id: friendId,
          name: friend.name || 'Amigo',
          username: friend.username || '',
          avatarUrl: fallbackAvatar,
          isOnline: Boolean(friend.isOnline ?? true),
          gameDesc: friend.gameDesc || '',
        };
      }
    });

    return await Promise.all(updatedFriendsPromises);
  } catch (error) {
    console.error('Erro ao correlacionar amizades e carregar avatares:', error);
    return [];
  }
}

export async function respondFriendRequest(userId: number | string, friendId: number | string, status: 'accepted' | 'rejected' | 'declined') {
  try {
    const response = await api.post('/friendships/respond', { userId, friendId, status });
    return response.data;
  } catch (error) {
    console.error('Erro ao responder pedido de amizade:', error);
    throw error;
  }
}

// ==========================================
// 4. MENSAGENS E CHAT
// ==========================================

export async function fetchChatMessages(userId: number | string, friendId: number | string) {
  try {
    const response = await api.get(`/messages/${userId}/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mensagens do chat:', error);
    throw error;
  }
}

export async function sendMessage(messageData: { sender_id: number; receiver_id: number; message_text: string }) {
  try {
    const response = await api.post('/messages', messageData);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

// ==========================================
// 5. NOTIFICAÇÕES
// ==========================================

export async function fetchNotifications(userId: number | string) {
  try {
    const response = await api.get(`/users/${userId}/notifications`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string | number) {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}