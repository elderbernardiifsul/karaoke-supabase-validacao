-- Amostra original para demonstração, sem apagar dados ou fixar IDs.
-- Repetir não duplica as linhas da amostra. A letra é texto didático original.
begin;
insert into artistas (nome) values ('Turma de Programação III') on conflict (nome) do nothing;
insert into musicas (nome, artista_id)
select 'Encontro da turma', a.id from artistas a
where a.nome = 'Turma de Programação III'
  and not exists (select 1 from musicas m where m.nome = 'Encontro da turma' and m.artista_id = a.id);
insert into partes (musica_id, ordem, letra, tempo_espera, tag)
select m.id, v.ordem, v.letra, v.tempo, v.tag
from musicas m join artistas a on a.id = m.artista_id
cross join (values
 (0, 'Uma ideia ganha forma na tela.', 1200, 'verso'),
 (1, 'A turma cria, testa e compartilha.', 1200, 'final')
) as v(ordem, letra, tempo, tag)
where m.nome = 'Encontro da turma' and a.nome = 'Turma de Programação III'
  and not exists (select 1 from partes p where p.musica_id = m.id and p.ordem = v.ordem);
commit;
