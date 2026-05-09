import { useState, useEffect, useCallback } from 'react'
import { mockDb } from '../lib/mockDb'
import type { Ticket, TicketStatus } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

interface TicketFilters {
  status?: TicketStatus | ''
  categoria?: string
  prioridade?: string
  search?: string
}

function enrichTickets(tickets: Ticket[], users: Awaited<ReturnType<typeof mockDb.getAllUsers>>, anexosMap: Record<string, any[]>, comentariosMap: Record<string, any[]>): Ticket[] {
  return tickets.map(t => ({
    ...t,
    criador: users.find(u => u.id === t.criado_por),
    responsavel_user: t.responsavel ? users.find(u => u.id === t.responsavel) : undefined,
    anexos: anexosMap[t.id] || [],
    comentarios: (comentariosMap[t.id] || []).map((c: any) => ({
      ...c,
      usuario: users.find(u => u.id === c.usuario_id),
    })),
  }))
}

export function useTickets(filters: TicketFilters = {}) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [rawTickets, allUsers] = await Promise.all([
      mockDb.getTickets(user.id, user.perfil, {
        status: filters.status || '',
        categoria: filters.categoria || '',
        prioridade: filters.prioridade || '',
        search: filters.search || '',
      }),
      mockDb.getAllUsers(),
    ])

    const anexosMap: Record<string, any[]> = {}
    const comentariosMap: Record<string, any[]> = {}
    await Promise.all(
      rawTickets.map(async t => {
        const [anexos, comentarios] = await Promise.all([
          mockDb.getAnexos(t.id),
          mockDb.getComentarios(t.id),
        ])
        anexosMap[t.id] = anexos
        comentariosMap[t.id] = comentarios
      })
    )

    setTickets(enrichTickets(rawTickets, allUsers, anexosMap, comentariosMap))
    setLoading(false)
  }, [user, filters.status, filters.categoria, filters.prioridade, filters.search])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  return { tickets, loading, refresh: fetchTickets }
}

export function useTicket(id: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTicket = useCallback(async () => {
    const [rawTicket, allUsers] = await Promise.all([
      mockDb.getTicket(id),
      mockDb.getAllUsers(),
    ])
    if (!rawTicket) { setLoading(false); return }

    const [anexos, comentarios] = await Promise.all([
      mockDb.getAnexos(id),
      mockDb.getComentarios(id),
    ])

    const enriched = {
      ...rawTicket,
      criador: allUsers.find(u => u.id === rawTicket.criado_por),
      responsavel_user: rawTicket.responsavel ? allUsers.find(u => u.id === rawTicket.responsavel) : undefined,
      anexos,
      comentarios: comentarios.map(c => ({ ...c, usuario: allUsers.find(u => u.id === c.usuario_id) })),
    }

    setTicket(enriched as Ticket)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchTicket() }, [fetchTicket])

  return { ticket, loading, refresh: fetchTicket }
}
