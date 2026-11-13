// src/services/friendshipService.ts
import { api, getFormattedAvatarUrl } from './api';

export interface FriendProfile {
  id: string | number;
  name: string;
  username: string;
  avatarUrl: string;
  isOnline?: boolean;
  gameDesc?: string;
}

/**
 * Busca a lista de amizades correlacionando o user_id logado com os friend_id da tabela friendships
 * e recupera a foto e os dados atualizados de cada amigo diretamente do backend.
 */
export async function fetchFriendsWithAvatars(currentUserId: string | number): Promise<FriendProfile[]> {
  if (!currentUserId) return [];

  try {
    // 1. Busca os relacionamentos de amizade do usuário logado
    const response = await api.get(`/users/${currentUserId}/friends`);
    const rawFriends = response.data || [];

    // 2. Correlaciona cada amigo obtido para carregar os perfis mais recentes via friend_id
    const updatedFriendsPromises = rawFriends.map(async (friend: any) => {
      // Determina o ID do amigo correlacionado (friend_id)
      const friendId = friend.friend_id || friend.friendId || friend.id;

      try {
        // Busca os dados atualizados diretamente da tabela de usuários pelo friend_id
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
        // Fallback caso a rota individual falhe
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