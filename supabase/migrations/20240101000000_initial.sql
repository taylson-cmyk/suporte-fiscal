-- ============================================================
-- Suporte Fiscal - Migração Supabase
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Tabela de usuários (espelha auth.users com campos extras)
create table if not exists public.usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('escritorio', 'cliente')),
  criado_em timestamptz default now()
);

-- Tabela de tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  numero serial not null unique,
  titulo text not null,
  descricao text not null,
  observacoes text,
  categoria text not null check (categoria in ('tributacao', 'revenda', 'consumo')),
  prioridade text not null check (prioridade in ('urgente', 'normal')),
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'concluido', 'impedido')),
  criado_por uuid references public.usuarios(id) not null,
  responsavel uuid references public.usuarios(id),
  criado_em timestamptz default now(),
  iniciado_em timestamptz,
  concluido_em timestamptz
);

-- Tabela de anexos
create table if not exists public.ticket_anexos (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  url_arquivo text not null,
  nome_arquivo text not null,
  enviado_em timestamptz default now()
);

-- Tabela de comentários
create table if not exists public.ticket_comentarios (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  usuario_id uuid references public.usuarios(id) not null,
  mensagem text not null,
  criado_em timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.usuarios enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_anexos enable row level security;
alter table public.ticket_comentarios enable row level security;

-- Funções auxiliares
create or replace function public.get_user_role(user_id uuid)
returns text language sql security definer stable as $$
  select perfil from public.usuarios where id = user_id
$$;

-- Políticas: usuarios
create policy "usuarios: leitura própria" on public.usuarios
  for select using (auth.uid() = id);

create policy "usuarios: escritório lê todos" on public.usuarios
  for select using (public.get_user_role(auth.uid()) = 'escritorio');

create policy "usuarios: inserção no cadastro" on public.usuarios
  for insert with check (auth.uid() = id);

-- Políticas: tickets
create policy "tickets: cliente vê os seus" on public.tickets
  for select using (
    public.get_user_role(auth.uid()) = 'cliente' and criado_por = auth.uid()
  );

create policy "tickets: escritório vê todos" on public.tickets
  for select using (public.get_user_role(auth.uid()) = 'escritorio');

create policy "tickets: qualquer usuário pode criar" on public.tickets
  for insert with check (auth.uid() = criado_por);

create policy "tickets: escritório pode atualizar" on public.tickets
  for update using (public.get_user_role(auth.uid()) = 'escritorio');

create policy "tickets: cliente pode atualizar seus próprios" on public.tickets
  for update using (
    public.get_user_role(auth.uid()) = 'cliente' and criado_por = auth.uid()
  );

-- Políticas: anexos
create policy "anexos: selecionar por acesso ao ticket" on public.ticket_anexos
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.criado_por = auth.uid() or public.get_user_role(auth.uid()) = 'escritorio')
    )
  );

create policy "anexos: inserir" on public.ticket_anexos
  for insert with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.criado_por = auth.uid() or public.get_user_role(auth.uid()) = 'escritorio')
    )
  );

-- Políticas: comentários
create policy "comentarios: selecionar por acesso ao ticket" on public.ticket_comentarios
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.criado_por = auth.uid() or public.get_user_role(auth.uid()) = 'escritorio')
    )
  );

create policy "comentarios: inserir" on public.ticket_comentarios
  for insert with check (
    auth.uid() = usuario_id and
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.criado_por = auth.uid() or public.get_user_role(auth.uid()) = 'escritorio')
    )
  );

-- ============================================================
-- Trigger: criar usuário na tabela pública ao registrar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'cliente')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Storage: bucket para anexos de tickets
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', true)
on conflict do nothing;

create policy "storage: upload autenticado" on storage.objects
  for insert with check (bucket_id = 'ticket-attachments' and auth.uid() is not null);

create policy "storage: leitura pública" on storage.objects
  for select using (bucket_id = 'ticket-attachments');

-- ============================================================
-- Realtime: habilitar para tabelas
-- ============================================================
alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.ticket_comentarios;
