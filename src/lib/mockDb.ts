import type { User, Ticket, TicketAnexo, TicketComentario, TicketCategory, TicketPriority, UserRole } from './types'

// ─── Storage helpers ───────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Seed demo data ────────────────────────────────────────────────────────────

const SEED_DONE = 'sf_seed_v1'

function seed() {
  if (localStorage.getItem(SEED_DONE)) return

  const escritorioId = 'user-escritorio-001'
  const clienteId = 'user-cliente-001'

  const users: User[] = [
    { id: escritorioId, nome: 'Ana Contadora', email: 'escritorio@demo.com', perfil: 'escritorio', criado_em: '2024-01-01T00:00:00Z' },
    { id: clienteId, nome: 'João Cliente', email: 'cliente@demo.com', perfil: 'cliente', criado_em: '2024-01-02T00:00:00Z' },
  ]
  set('sf_users', users)

  const now = Date.now()
  const tickets: Ticket[] = [
    {
      id: 't1', numero: 1, titulo: 'Dúvida sobre ICMS na nota fiscal',
      descricao: 'Preciso entender como calcular o ICMS para operações interestaduais.',
      observacoes: 'Temos clientes em SP e RJ.',
      categoria: 'tributacao', prioridade: 'urgente', status: 'em_andamento',
      criado_por: clienteId, responsavel: escritorioId,
      criado_em: new Date(now - 3600000 * 5).toISOString(),
      iniciado_em: new Date(now - 3600000 * 4).toISOString(),
      concluido_em: null,
    },
    {
      id: 't2', numero: 2, titulo: 'Enquadramento tributário para revenda',
      descricao: 'Preciso saber qual o melhor regime para revenda de eletrônicos.',
      observacoes: null,
      categoria: 'revenda', prioridade: 'normal', status: 'nao_iniciado',
      criado_por: clienteId, responsavel: null,
      criado_em: new Date(now - 3600000 * 2).toISOString(),
      iniciado_em: null, concluido_em: null,
    },
    {
      id: 't3', numero: 3, titulo: 'Cálculo de impostos para consumo próprio',
      descricao: 'Como contabilizar aquisições para consumo interno da empresa?',
      observacoes: 'Empresa do Simples Nacional.',
      categoria: 'consumo', prioridade: 'normal', status: 'concluido',
      criado_por: clienteId, responsavel: escritorioId,
      criado_em: new Date(now - 3600000 * 48).toISOString(),
      iniciado_em: new Date(now - 3600000 * 47).toISOString(),
      concluido_em: new Date(now - 3600000 * 24).toISOString(),
    },
  ]
  set('sf_tickets', tickets)
  set('sf_anexos', [] as TicketAnexo[])
  set('sf_comentarios', [
    { id: 'c1', ticket_id: 't1', usuario_id: escritorioId, mensagem: 'Estamos analisando o seu caso. Em breve retornaremos!', criado_em: new Date(now - 3600000 * 3).toISOString() },
    { id: 'c2', ticket_id: 't1', usuario_id: clienteId, mensagem: 'Obrigado! Aguardando o retorno.', criado_em: new Date(now - 3600000 * 2).toISOString() },
  ] as TicketComentario[])
  set('sf_next_ticket_num', 4)
  localStorage.setItem(SEED_DONE, '1')
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type MockSession = { user: { id: string } }

let _session: MockSession | null = null
let _authListeners: Array<(session: MockSession | null) => void> = []

function notifyAuth(session: MockSession | null) {
  _authListeners.forEach(fn => fn(session))
}

export const mockAuth = {
  getSession(): MockSession | null {
    if (_session) return _session
    const saved = localStorage.getItem('sf_session')
    if (saved) { _session = JSON.parse(saved); return _session }
    return null
  },
  onAuthStateChange(cb: (session: MockSession | null) => void) {
    _authListeners.push(cb)
    return { unsubscribe: () => { _authListeners = _authListeners.filter(f => f !== cb) } }
  },
  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const users = get<User[]>('sf_users', [])
    const passwords = get<Record<string, string>>('sf_passwords', {})
    const user = users.find(u => u.email === email)
    if (!user) return { error: 'Usuário não encontrado' }
    const stored = passwords[user.id]
    if (stored && stored !== password) return { error: 'Senha incorreta' }
    _session = { user: { id: user.id } }
    localStorage.setItem('sf_session', JSON.stringify(_session))
    notifyAuth(_session)
    return { error: null }
  },
  async signUp(email: string, password: string, nome: string, perfil: UserRole): Promise<{ error: string | null }> {
    const users = get<User[]>('sf_users', [])
    if (users.find(u => u.email === email)) return { error: 'E-mail já cadastrado' }
    const id = `user-${Date.now()}`
    const newUser: User = { id, nome, email, perfil, criado_em: new Date().toISOString() }
    set('sf_users', [...users, newUser])
    const passwords = get<Record<string, string>>('sf_passwords', {})
    set('sf_passwords', { ...passwords, [id]: password })
    return { error: null }
  },
  signOut() {
    _session = null
    localStorage.removeItem('sf_session')
    notifyAuth(null)
  },
}

// ─── DB helpers ────────────────────────────────────────────────────────────────

function delay(ms = 80): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export const mockDb = {
  // Users
  async getUser(id: string): Promise<User | null> {
    await delay()
    const users = get<User[]>('sf_users', [])
    return users.find(u => u.id === id) || null
  },
  async getAllUsers(): Promise<User[]> {
    await delay()
    return get<User[]>('sf_users', [])
  },
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await delay()
    const users = get<User[]>('sf_users', [])
    set('sf_users', users.map(u => u.id === id ? { ...u, ...updates } : u))
  },

  // Tickets
  async getTickets(userId: string, perfil: UserRole, filters: Record<string, string> = {}): Promise<Ticket[]> {
    await delay()
    let tickets = get<Ticket[]>('sf_tickets', [])
    if (perfil === 'cliente') tickets = tickets.filter(t => t.criado_por === userId)
    if (filters.status) tickets = tickets.filter(t => t.status === filters.status)
    if (filters.categoria) tickets = tickets.filter(t => t.categoria === filters.categoria)
    if (filters.prioridade) tickets = tickets.filter(t => t.prioridade === filters.prioridade)
    if (filters.search) tickets = tickets.filter(t => t.titulo.toLowerCase().includes(filters.search.toLowerCase()))
    return tickets.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  },
  async getTicket(id: string): Promise<Ticket | null> {
    await delay()
    return get<Ticket[]>('sf_tickets', []).find(t => t.id === id) || null
  },
  async createTicket(data: {
    titulo: string; descricao: string; observacoes: string | null
    categoria: TicketCategory; prioridade: TicketPriority; criado_por: string
  }): Promise<Ticket> {
    await delay()
    const num = get<number>('sf_next_ticket_num', 1)
    set('sf_next_ticket_num', num + 1)
    const ticket: Ticket = {
      id: `t-${Date.now()}`,
      numero: num,
      status: 'nao_iniciado',
      responsavel: null,
      criado_em: new Date().toISOString(),
      iniciado_em: null,
      concluido_em: null,
      ...data,
    }
    set('sf_tickets', [...get<Ticket[]>('sf_tickets', []), ticket])
    return ticket
  },
  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    await delay()
    set('sf_tickets', get<Ticket[]>('sf_tickets', []).map(t => t.id === id ? { ...t, ...updates } : t))
  },

  // Anexos
  async getAnexos(ticketId: string): Promise<TicketAnexo[]> {
    await delay()
    return get<TicketAnexo[]>('sf_anexos', []).filter(a => a.ticket_id === ticketId)
  },
  async addAnexo(ticketId: string, file: File): Promise<TicketAnexo> {
    await delay()
    const url = URL.createObjectURL(file)
    const anexo: TicketAnexo = {
      id: `a-${Date.now()}`,
      ticket_id: ticketId,
      url_arquivo: url,
      nome_arquivo: file.name,
      enviado_em: new Date().toISOString(),
    }
    set('sf_anexos', [...get<TicketAnexo[]>('sf_anexos', []), anexo])
    return anexo
  },

  // Comentários
  async getComentarios(ticketId: string): Promise<TicketComentario[]> {
    await delay()
    return get<TicketComentario[]>('sf_comentarios', []).filter(c => c.ticket_id === ticketId)
  },
  async addComentario(ticketId: string, usuarioId: string, mensagem: string): Promise<TicketComentario> {
    await delay()
    const c: TicketComentario = {
      id: `c-${Date.now()}`,
      ticket_id: ticketId,
      usuario_id: usuarioId,
      mensagem,
      criado_em: new Date().toISOString(),
    }
    set('sf_comentarios', [...get<TicketComentario[]>('sf_comentarios', []), c])
    return c
  },

  // Realtime (no-op para mock — componentes usam refresh manual)
  subscribe(_table: string, _cb: () => void) {
    return { unsubscribe: () => {} }
  },
}

seed()
