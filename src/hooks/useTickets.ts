import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Ticket, TicketStatus } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

interface TicketFilters {
  status?: TicketStatus | ''
  categoria?: string
  prioridade?: string
  search?: string
}

export function useTickets(filters: TicketFilters = {}) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('tickets')
      .select(`
        *,
        criador:criado_por(id, nome, email, perfil),
        responsavel_user:responsavel(id, nome, email, perfil),
        anexos:ticket_anexos(*),
        comentarios:ticket_comentarios(*, usuario:usuario_id(id, nome, email, perfil))
      `)
      .order('criado_em', { ascending: false })

    if (user.perfil === 'cliente') {
      query = query.eq('criado_por', user.id)
    }
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.categoria) query = query.eq('categoria', filters.categoria)
    if (filters.prioridade) query = query.eq('prioridade', filters.prioridade)
    if (filters.search) query = query.ilike('titulo', `%${filters.search}%`)

    const { data, error } = await query
    if (!error && data) setTickets(data as unknown as Ticket[])
    setLoading(false)
  }, [user, filters.status, filters.categoria, filters.prioridade, filters.search])

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTickets])

  return { tickets, loading, refresh: fetchTickets }
}

export function useTicket(id: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTicket = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        criador:criado_por(id, nome, email, perfil),
        responsavel_user:responsavel(id, nome, email, perfil),
        anexos:ticket_anexos(*),
        comentarios:ticket_comentarios(*, usuario:usuario_id(id, nome, email, perfil))
      `)
      .eq('id', id)
      .single()

    if (!error && data) setTicket(data as unknown as Ticket)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchTicket()

    const channel = supabase
      .channel(`ticket-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, fetchTicket)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_comentarios', filter: `ticket_id=eq.${id}` }, fetchTicket)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchTicket])

  return { ticket, loading, refresh: fetchTicket }
}
