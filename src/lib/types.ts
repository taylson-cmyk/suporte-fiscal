export type UserRole = 'escritorio' | 'cliente'

export type TicketStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'impedido'
export type TicketCategory = 'tributacao' | 'revenda' | 'consumo'
export type TicketPriority = 'urgente' | 'normal'

export interface User {
  id: string
  nome: string
  email: string
  perfil: UserRole
  criado_em: string
}

export interface Ticket {
  id: string
  numero: number
  titulo: string
  descricao: string
  observacoes: string | null
  categoria: TicketCategory
  prioridade: TicketPriority
  status: TicketStatus
  criado_por: string
  responsavel: string | null
  criado_em: string
  iniciado_em: string | null
  concluido_em: string | null
  // joined fields
  criador?: User
  responsavel_user?: User
  anexos?: TicketAnexo[]
  comentarios?: TicketComentario[]
}

export interface TicketAnexo {
  id: string
  ticket_id: string
  url_arquivo: string
  nome_arquivo: string
  enviado_em: string
}

export interface TicketComentario {
  id: string
  ticket_id: string
  usuario_id: string
  mensagem: string
  criado_em: string
  usuario?: User
}

export interface DashboardStats {
  nao_iniciado: number
  em_andamento: number
  concluido: number
  impedido: number
}
