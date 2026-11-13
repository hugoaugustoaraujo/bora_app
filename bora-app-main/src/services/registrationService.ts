// src/services/registrationService.ts
import axios from 'axios';
import { api } from './api';

export interface UserRegistrationData {
  name: string;
  username: string;
  email: string;
  password_hash: string;
  location_name?: string;
  birth_date?: Date | string;
  bio?: string;
  avatar_url?: string;
}

export interface UserRegistrationResponse {
  id: number;
  name: string;
  username: string;
  email: string;
  location_name: string;
  bio: string;
  avatar_url: string;
  birth_date?: string;
}

/**
 * Formata a data local para o padrão YYYY-MM-DD sem distorção de fuso horário UTC.
 */
const formatLocalDate = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const sendRegistrationToDatabase = async (
  formData: UserRegistrationData
): Promise<UserRegistrationResponse> => {
  try {
    const formattedBirthDate = formData.birth_date
      ? formatLocalDate(formData.birth_date)
      : null;

    const payload = {
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email: formData.email.trim().toLowerCase(),
      password_hash: formData.password_hash,
      location_name: formData.location_name?.trim() || 'Maceió, AL',
      birth_date: formattedBirthDate,
      bio: formData.bio || 'Membro do Bora',
      avatar_url:
        formData.avatar_url ||
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    };

    console.log('📤 [REGISTRATION] A enviar payload para o banco via HTTPS:', payload);

    const response = await api.post<UserRegistrationResponse>('/users', payload);

    console.log('✅ [REGISTRATION] Utilizador registado com sucesso. ID:', response.data.id);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('A conexão com o servidor expirou (Timeout). Verifique se o servidor backend está ativo.');
      }
      if (error.response) {
        const serverError = error.response.data?.error || 'Erro ao processar o cadastro no servidor.';
        throw new Error(serverError);
      } else if (error.request) {
        throw new Error('Não foi possível estabelecer conexão HTTPS com o servidor backend.');
      }
    }
    throw new Error(error.message || 'Falha desconhecida ao comunicar com a base de dados.');
  }
};