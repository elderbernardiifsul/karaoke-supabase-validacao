-- sql/diagnostico.sql
-- Programação III — IFSul Passo Fundo.
-- Confere se as tabelas do karaokê estão como a aplicação espera.
-- SOMENTE LEITURA: não cria, não altera e não apaga nada. Pode rodar quantas vezes quiser.
-- Leiam a coluna "situacao":
--   ok       nada a fazer
--   ajustar  rodem o sql/ajustes.sql e depois este diagnóstico de novo
--   criar    falta tabela ou coluna: vejam a etapa 4 do guia
--   conferir funciona, mas está diferente do esperado: leiam o "detalhe"
with esperado(tabela, coluna) as (
    values ('artistas', 'id'), ('artistas', 'nome'),
           ('musicas', 'id'), ('musicas', 'nome'), ('musicas', 'artista_id'),
           ('partes', 'id'), ('partes', 'musica_id'), ('partes', 'ordem'),
           ('partes', 'letra'), ('partes', 'tempo_espera'), ('partes', 'tag')
),
colunas as (
    select e.tabela, e.coluna, c.data_type, c.is_nullable
    from esperado e
    left join information_schema.columns c
      on c.table_schema = 'public' and c.table_name = e.tabela and c.column_name = e.coluna
),
fk_partes as (
    select con.confdeltype
    from pg_constraint con
    where con.contype = 'f'
      and con.conrelid = to_regclass('public.partes')
      and con.confrelid = to_regclass('public.musicas')
),
fk_musicas as (
    select 1
    from pg_constraint con
    where con.contype = 'f'
      and con.conrelid = to_regclass('public.musicas')
      and con.confrelid = to_regclass('public.artistas')
),
unico_nome as (
    select 1
    from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = to_regclass('public.artistas')
      and i.indisunique and i.indnatts = 1 and a.attname = 'nome'
)
select 1 as ordem, 'tabela ' || t.nome as verificacao,
       case when to_regclass('public.' || t.nome) is null then 'criar' else 'ok' end as situacao,
       case when to_regclass('public.' || t.nome) is null then 'a tabela não existe' else 'encontrada' end as detalhe
from (values ('artistas'), ('musicas'), ('partes')) as t(nome)
union all
select 2, 'coluna ' || tabela || '.' || coluna,
       case when data_type is null then 'criar' when is_nullable = 'YES' then 'conferir' else 'ok' end,
       case when data_type is null then 'a coluna não existe (confiram o nome, letra por letra)'
            when is_nullable = 'YES' then 'tipo ' || data_type || '; aceita vazio, mas deveria ser not null'
            else 'tipo ' || data_type end
from colunas
union all
select 3, 'ligação partes → musicas',
       case when exists (select 1 from fk_partes where confdeltype = 'c') then 'ok' else 'ajustar' end,
       case when not exists (select 1 from fk_partes) then 'não há chave estrangeira de partes.musica_id para musicas'
            when exists (select 1 from fk_partes where confdeltype = 'c') then 'on delete cascade: excluir a música apaga as partes'
            else 'sem on delete cascade: excluir música com partes vai falhar (erro 23503)' end
union all
select 4, 'ligação musicas → artistas',
       case when exists (select 1 from fk_musicas) then 'ok' else 'ajustar' end,
       case when exists (select 1 from fk_musicas) then 'chave estrangeira encontrada'
            else 'não há chave estrangeira de musicas.artista_id para artistas' end
union all
select 5, 'nome de artista único',
       case when exists (select 1 from unico_nome) then 'ok' else 'ajustar' end,
       case when exists (select 1 from unico_nome) then 'artistas.nome não se repete'
            else 'artistas.nome aceita repetição: o buscarOuCriar pode falhar' end
union all
select 6, 'RLS em ' || t.nome,
       case when c.oid is null then 'criar' when c.relrowsecurity then 'ok' else 'conferir' end,
       case when c.oid is null then 'a tabela não existe'
            when c.relrowsecurity then 'ligado (a secret key do servidor passa por cima)'
            else 'desligado: a chave pública veria os dados; o ajustes.sql liga' end
from (values ('artistas'), ('musicas'), ('partes')) as t(nome)
left join pg_class c on c.oid = to_regclass('public.' || t.nome)
order by ordem, verificacao;
