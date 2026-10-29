-- sql/ajustes.sql
-- Programação III — IFSul Passo Fundo.
-- Corrige o que o diagnostico.sql marcou como "ajustar". NÃO apaga dados.
-- Pode rodar mais de uma vez: o que já está certo fica como está.
-- Se algo impedir o ajuste, nada é alterado e aparece uma mensagem explicando.
begin;

do $$
declare
    fk record;
begin
    -- 1. partes.musica_id → musicas, com on delete cascade
    for fk in
        select conname
        from pg_constraint
        where contype = 'f'
          and conrelid = 'public.partes'::regclass
          and confrelid = 'public.musicas'::regclass
          and confdeltype <> 'c'
    loop
        execute format('alter table public.partes drop constraint %I', fk.conname);
        execute format('alter table public.partes add constraint %I foreign key (musica_id) references public.musicas (id) on delete cascade', fk.conname);
        raise notice 'Ligação % refeita com on delete cascade.', fk.conname;
    end loop;

    if not exists (
        select 1 from pg_constraint
        where contype = 'f' and conrelid = 'public.partes'::regclass and confrelid = 'public.musicas'::regclass
    ) then
        if exists (select 1 from public.partes p where not exists (select 1 from public.musicas m where m.id = p.musica_id)) then
            raise exception 'Há partes apontando para músicas que não existem. Chamem o professor antes de continuar.';
        end if;
        alter table public.partes add constraint partes_musica_id_fkey
            foreign key (musica_id) references public.musicas (id) on delete cascade;
        raise notice 'Ligação partes_musica_id_fkey criada com on delete cascade.';
    end if;

    -- 2. musicas.artista_id → artistas
    if not exists (
        select 1 from pg_constraint
        where contype = 'f' and conrelid = 'public.musicas'::regclass and confrelid = 'public.artistas'::regclass
    ) then
        if exists (select 1 from public.musicas m where not exists (select 1 from public.artistas a where a.id = m.artista_id)) then
            raise exception 'Há músicas apontando para artistas que não existem. Chamem o professor antes de continuar.';
        end if;
        alter table public.musicas add constraint musicas_artista_id_fkey
            foreign key (artista_id) references public.artistas (id);
        raise notice 'Ligação musicas_artista_id_fkey criada.';
    end if;

    -- 3. nome de artista único
    if not exists (
        select 1 from pg_index i
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
        where i.indrelid = 'public.artistas'::regclass and i.indisunique and i.indnatts = 1 and a.attname = 'nome'
    ) then
        if exists (select nome from public.artistas group by nome having count(*) > 1) then
            raise exception 'Há artistas com o mesmo nome. Vejam no guia, etapa 4B, como encontrar as repetições e chamem o professor.';
        end if;
        alter table public.artistas add constraint artistas_nome_key unique (nome);
        raise notice 'Regra de nome único criada em artistas.nome.';
    end if;
end $$;

-- 4. RLS ligado nas três tabelas (sem regras: só a secret key do servidor acessa)
alter table public.artistas enable row level security;
alter table public.musicas enable row level security;
alter table public.partes enable row level security;

commit;
