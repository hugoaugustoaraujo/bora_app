import { getFormattedAvatarUrl, getBaseServerURL } from '../services/api';

describe('Testes Unitários - Serviços do Frontend (Bora App)', () => {
  it('1. Deve formatar corretamente URLs de avatar (fallback, externas e caminhos relativos)', () => {
    const fallback = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
    const baseServer = getBaseServerURL();

    expect(getFormattedAvatarUrl(undefined)).toBe(fallback);
    expect(getFormattedAvatarUrl('')).toBe(fallback);

    const externalUrl = 'https://exemplo.com/foto.png';
    expect(getFormattedAvatarUrl(externalUrl)).toBe(externalUrl);

    expect(getFormattedAvatarUrl('/images/avatar.jpg')).toBe(`${baseServer}/images/avatar.jpg`);
  });

  it('2. Deve formatar objetos Date para YYYY-MM-DD mantendo o dia local exato', () => {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dataTeste = new Date(2000, 0, 5);
    expect(formatLocalDate(dataTeste)).toBe('2000-01-05');
  });
});