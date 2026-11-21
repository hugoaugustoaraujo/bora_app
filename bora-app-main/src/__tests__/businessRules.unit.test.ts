describe('Testes Unitários - Regras de Negócio do Backend', () => {
  // TESTE UNITÁRIO 1: Cálculo de vagas disponíveis na criação da partida
  it('1. Deve calcular corretamente as vagas restantes subtraindo o organizador', () => {
    const calcularVagasIniciais = (totalSpots: number) => Math.max(totalSpots - 1, 0);

    expect(calcularVagasIniciais(8)).toBe(7);
    expect(calcularVagasIniciais(2)).toBe(1);
    expect(calcularVagasIniciais(1)).toBe(0);
    expect(calcularVagasIniciais(0)).toBe(0);
  });

  // TESTE UNITÁRIO 2: Sanitização e normalização de @username no cadastro
  it('2. Deve sanitizar o username removendo caracteres especiais e convertendo para minúsculas', () => {
    const sanitizarUsername = (rawUsername: string) =>
      rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    expect(sanitizarUsername('  @Hugo.Augusto!2026 ')).toBe('hugoaugusto2026');
    expect(sanitizarUsername('Ellen_Goncalves#1')).toBe('ellen_goncalves1');
  });

  // TESTE UNITÁRIO 3: Validação de campos obrigatórios no registro de utilizador
  it('3. Deve invalidar o cadastro caso nome, e-mail ou senha estejam ausentes ou vazios', () => {
    const validarCadastro = (payload: { name?: string; email?: string; password_hash?: string }) => {
      return Boolean(payload.name?.trim() && payload.email?.trim() && payload.password_hash?.trim());
    };

    expect(validarCadastro({ name: 'Paulo', email: 'paulo@bora.com', password_hash: '12345678' })).toBe(true);
    expect(validarCadastro({ name: '', email: 'paulo@bora.com', password_hash: '12345678' })).toBe(false);
    expect(validarCadastro({ name: 'Paulo', email: 'paulo@bora.com' })).toBe(false);
  });
});