import React, { createContext, useState, useContext, ReactNode } from 'react';
import { api, registerUser } from '../src/services/api';

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
}

export interface Match {
  id: string;
  title: string;
  category: string;
  type: 'Presencial';
  date: string;
  locationOrPlatform: string;
  vacancies: number;
  totalSpots: number;
  organizerId?: number;
  organizerName?: string;
  organizerAvatar?: string;
  participantStatus?: string;
  latitude?: number;
  longitude?: number;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

interface AppContextData {
  matches: Match[];
  userProfile: any;
  friends: any[];
  pendingRequests: any[];
  chatMessages: Record<string, ChatMessage[]>;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updatedData: Partial<any>) => void;
  updateUserSettings: (settings: any) => Promise<void>;
  addMatch: (newMatchData: any) => Promise<void>;
  joinMatch: (matchId: string) => void;
  inviteFriendToMatch: (matchId: string, friendId: string) => Promise<void>;
  loadMatches: (userId?: number) => Promise<void>;
  loadFriends: (userId?: number) => Promise<void>;
  loadChatMessages: (friendId: string) => Promise<void>;
  sendMessageToFriend: (friendId: string, text: string) => Promise<void>;
  acceptFriendRequest: (friendId: string) => Promise<void>;
  rejectFriendRequest: (friendId: string) => Promise<void>;
  searchUserByUsername: (username: string) => Promise<any>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  unfriendUser: (friendId: string) => Promise<void>;
  blockUser: (targetId: string) => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  [key: string]: any;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<any>({
    id: null,
    name: 'Visitante',
    username: '@visitante',
    location: 'Maceió, AL',
    bio: 'Faça login para ver o seu perfil.',
    playedCount: 0,
    organizedCount: 0,
    scheduledCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    is_private: false,
    push_notifications: true,
    email_alerts: false,
    dark_mode: false,
  });

  const loadMatches = async (currentUserId?: number) => {
    try {
      const targetId = currentUserId || userProfile?.id;
      const response = await api.get('/matches', {
        params: { userId: targetId }
      });

      const matchesMap = new Map();
      let organizedCount = 0;
      let playedCount = 0;

      response.data.forEach((item: any) => {
        const creatorName = item.organizer_name || 'Organizador';
        const realOrganizerId = Number(item.real_organizer_id || item.organizer_id);

        if (realOrganizerId === targetId) {
          organizedCount += 1;
        }
        if (item.participant_status === 'confirmed') {
          playedCount += 1;
        }

        let creatorAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
        if (item.organizer_avatar) {
          creatorAvatar = item.organizer_avatar.startsWith('http')
            ? item.organizer_avatar
            : `http://localhost:3000/images/${item.organizer_avatar}`;
        }

        const matchId = String(item.id);

        const formattedParticipants = (item.participants || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          avatarUrl: p.avatarUrl 
            ? (p.avatarUrl.startsWith('http') ? p.avatarUrl : `http://localhost:3000/images/${p.avatarUrl}`)
            : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          role: p.role,
        }));

        if (!matchesMap.has(matchId)) {
          matchesMap.set(matchId, {
            id: matchId,
            title: item.title,
            category: `${item.modality || 'Vôlei'} · ${item.category}`,
            type: 'Presencial',
            date: new Date(item.match_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
            locationOrPlatform: item.location_name,
            vacancies: item.vacancies,
            totalSpots: item.total_spots,
            organizerId: realOrganizerId,
            organizerName: creatorName,
            organizerAvatar: creatorAvatar,
            participantStatus: item.participant_status,
            latitude: item.latitude || item.lat,
            longitude: item.longitude || item.lng,
            participants: formattedParticipants.length > 0 ? formattedParticipants : [
              {
                id: String(realOrganizerId || '1'),
                name: creatorName,
                avatarUrl: creatorAvatar,
                role: 'Organizador',
              }
            ],
          });
        }
      });

      setUserProfile((prev: any) => ({
        ...prev,
        organizedCount,
        playedCount,
      }));

      setMatches(Array.from(matchesMap.values()));
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
    }
  };

  const loadFriends = async (targetUserId?: number) => {
    try {
      const userId = targetUserId || userProfile?.id;
      if (!userId) return;

      const response = await api.get(`/users/${userId}/friends`);
      
      const acceptedList: any[] = [];
      const pendingList: any[] = [];

      response.data.forEach((user: any) => {
        let userAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
        if (user.avatar_url) {
          userAvatar = user.avatar_url.startsWith('http')
            ? user.avatar_url
            : `http://localhost:3000/images/${user.avatar_url}`;
        }

        const formattedUser = {
          id: String(user.id),
          name: user.name,
          username: user.username,
          avatarUrl: userAvatar,
          gameDesc: `@${user.username} · ${user.location_name || 'Maceió, AL'}`,
          status: user.status === 'accepted' ? 'Online' : 'Pendente',
          isOnline: true,
          senderId: String(user.sender_id),
        };

        if (user.status === 'accepted') {
          acceptedList.push(formattedUser);
        } else if (user.status === 'pending') {
          if (Number(user.sender_id) !== Number(userId)) {
            pendingList.push(formattedUser);
          }
        }
      });

      setFriends(acceptedList);
      setPendingRequests(pendingList);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
    }
  };

  const loadChatMessages = async (friendId: string) => {
    if (!userProfile?.id || !friendId) return;
    try {
      const response = await api.get(`/messages/${userProfile.id}/${friendId}`);
      const formattedMessages: ChatMessage[] = response.data.map((msg: any) => ({
        id: String(msg.id),
        sender: Number(msg.sender_id) === Number(userProfile.id) ? 'me' : 'other',
        text: msg.message_text,
        time: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));

      setChatMessages((prev) => ({
        ...prev,
        [friendId]: formattedMessages,
      }));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessageToFriend = async (friendId: string, text: string) => {
    if (!userProfile?.id || !friendId || !text.trim()) return;
    try {
      await api.post('/messages', {
        sender_id: userProfile.id,
        receiver_id: friendId,
        message_text: text.trim(),
      });
      await loadChatMessages(friendId);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const dbUser = await registerUser(userData);

      let avatarFinal = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
      if (dbUser.avatar_url) {
        avatarFinal = dbUser.avatar_url.startsWith('http')
          ? dbUser.avatar_url
          : `http://localhost:3000/images/${dbUser.avatar_url}`;
      }

      const updatedProfile = {
        id: dbUser.id,
        name: dbUser.name,
        username: `@${dbUser.username}`,
        email: dbUser.email,
        location: dbUser.location_name || 'Maceió, AL',
        bio: dbUser.bio || 'Membro do Bora',
        birth_date: dbUser.birth_date,
        playedCount: 0,
        organizedCount: 0,
        scheduledCount: 0,
        avatarUrl: avatarFinal,
        is_private: false,
        push_notifications: true,
        email_alerts: false,
        dark_mode: false,
      };

      setUserProfile(updatedProfile);
      setIsAuthenticated(true);

      return true;
    } catch (error: any) {
      console.error('Erro no registro via AppContext:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/login', { email, password });
      const dbUser = response.data;

      let avatarFinal = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
      if (dbUser.avatar_url) {
        avatarFinal = dbUser.avatar_url.startsWith('http')
          ? dbUser.avatar_url
          : `http://localhost:3000/images/${dbUser.avatar_url}`;
      }

      const updatedProfile = {
        id: dbUser.id,
        name: dbUser.name,
        username: `@${dbUser.username}`,
        email: dbUser.email,
        location: dbUser.location_name,
        bio: dbUser.bio,
        playedCount: 0,
        organizedCount: 0,
        scheduledCount: 0,
        avatarUrl: avatarFinal,
        is_private: dbUser.is_private || false,
        push_notifications: dbUser.push_notifications ?? true,
        email_alerts: dbUser.email_alerts || false,
        dark_mode: dbUser.dark_mode || false,
      };

      setUserProfile(updatedProfile);
      setIsDarkMode(dbUser.dark_mode || false);
      setIsAuthenticated(true);

      await loadFriends(dbUser.id);
      await loadMatches(dbUser.id);

      return true;
    } catch (error: any) {
      console.error('Erro ao realizar login:', error?.response?.data || error);
      throw error;
    }
  };

  const logout = () => {
    setUserProfile({
      id: null,
      name: 'Visitante',
      username: '@visitante',
      location: 'Maceió, AL',
      bio: 'Faça login para ver o seu perfil.',
      playedCount: 0,
      organizedCount: 0,
      scheduledCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      is_private: false,
      push_notifications: true,
      email_alerts: false,
      dark_mode: false,
    });
    setFriends([]);
    setPendingRequests([]);
    setMatches([]);
    setChatMessages({});
    setIsDarkMode(false);
    setIsAuthenticated(false);
  };

  const updateUserProfile = (updatedData: Partial<any>) => {
    setUserProfile((prev: any) => ({
      ...prev,
      ...updatedData,
    }));
  };

  const updateUserSettings = async (settings: any) => {
    if (!userProfile?.id) return;
    try {
      const response = await api.patch(`/users/${userProfile.id}/settings`, settings);
      const updated = response.data;

      setUserProfile((prev: any) => ({
        ...prev,
        is_private: updated.is_private,
        push_notifications: updated.push_notifications,
        email_alerts: updated.email_alerts,
        dark_mode: updated.dark_mode,
      }));

      if (updated.dark_mode !== undefined) {
        setIsDarkMode(updated.dark_mode);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
  };

  const addMatch = async (newMatchData: any) => {
    try {
      await api.post('/matches', {
        title: newMatchData.title,
        category: newMatchData.category,
        modality: newMatchData.modality,
        match_date: newMatchData.match_date,
        location_name: newMatchData.location_name,
        lat: newMatchData.lat,
        lng: newMatchData.lng,
        total_spots: newMatchData.total_spots,
        organizer_id: newMatchData.organizer_id,
        is_public: newMatchData.is_public,
      });

      await loadMatches(userProfile?.id);
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      throw error;
    }
  };

  const joinMatch = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId && m.vacancies > 0) {
          const userName = userProfile?.name || 'Participante';
          const userAvatar = userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
          const alreadyIn = m.participants.some((p) => p.name === userName);

          const newParticipant: Participant = {
            id: String(userProfile?.id || Date.now()),
            name: userName,
            avatarUrl: userAvatar,
            role: 'Participante',
          };

          return {
            ...m,
            vacancies: m.vacancies - 1,
            participants: alreadyIn ? m.participants : [...m.participants, newParticipant],
          };
        }
        return m;
      })
    );
  };

  const inviteFriendToMatch = async (matchId: string, friendId: string) => {
    try {
      await api.post(`/matches/${matchId}/invite`, { friendId });
      await loadMatches(userProfile?.id);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.post('/friendships/respond', {
        userId: userProfile.id,
        friendId: friendId,
        status: 'accepted',
      });
      await loadFriends(userProfile.id);
    } catch (error) {
      console.error('Erro ao aceitar amizade:', error);
    }
  };

  const rejectFriendRequest = async (friendId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.post('/friendships/respond', {
        userId: userProfile.id,
        friendId: friendId,
        status: 'rejected',
      });
      await loadFriends(userProfile.id);
    } catch (error) {
      console.error('Erro ao recusar amizade:', error);
    }
  };

  const searchUserByUsername = async (username: string) => {
    try {
      const response = await api.get('/users/search', {
        params: { 
          username, 
          userId: userProfile?.id 
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar utilizador:', error);
      throw new Error(error.response?.data?.error || 'Utilizador não encontrado ou já adicionado.');
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.post('/friendships/request', {
        userId: userProfile.id,
        friendId,
      });
      await loadFriends(userProfile.id);
    } catch (error: any) {
      console.error('Erro ao enviar pedido:', error);
      throw new Error(error.response?.data?.error || 'Erro ao enviar pedido de amizade.');
    }
  };

  const unfriendUser = async (friendId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.post('/friendships/unfriend', {
        userId: userProfile.id,
        friendId,
      });
      await loadFriends(userProfile.id);
    } catch (error) {
      console.error('Erro ao desfazer amizade:', error);
    }
  };

  const blockUser = async (targetId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.post('/users/block', {
        userId: userProfile.id,
        targetId,
      });
      await loadFriends(userProfile.id);
    } catch (error) {
      console.error('Erro ao bloquear utilizador:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        matches,
        userProfile,
        friends,
        pendingRequests,
        chatMessages,
        isAuthenticated,
        isDarkMode,
        login,
        register,
        logout,
        updateUserProfile,
        updateUserSettings,
        addMatch,
        joinMatch,
        inviteFriendToMatch,
        loadMatches,
        loadFriends,
        loadChatMessages,
        sendMessageToFriend,
        acceptFriendRequest,
        rejectFriendRequest,
        searchUserByUsername,
        sendFriendRequest,
        unfriendUser,
        blockUser,
        setUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);