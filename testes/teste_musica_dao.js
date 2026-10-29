// testes/teste_musica_dao.js — confere o MusicaDAO no banco: lista, busca, insere, edita e remove.
// Rodem com: node testes/teste_musica_dao.js
// Usa o artista da amostra para não criar artistas novos; remove a música que criar.
const musicaDAO = require('../DAO/MusicaDAO');

async function testar() {
    const musicas = await musicaDAO.listarTodas();
    console.log('Músicas no banco:', musicas.length);
    const amostra = musicas.find((m) => m.nome === 'Encontro da turma');
    if (!amostra) throw new Error('A música de amostra não está no banco: rodem o sql/seed.sql');
    console.log('Amostra:', amostra.id, amostra.nome, '—', amostra.artista.nome, '·', amostra.totalPartes, 'partes');

    const completa = await musicaDAO.buscarPorId(amostra.id);
    console.log('Partes da amostra:', completa.partes.length);

    const nova = await musicaDAO.inserir('Música de teste do DAO', 'Turma de Programação III');
    console.log('Inserida com id', nova.id);
    const editada = await musicaDAO.atualizar(nova.id, 'Música de teste do DAO (editada)', 'Turma de Programação III');
    console.log('Editada:', editada.nome, '— mesmo id?', editada.id === nova.id);
    const removida = await musicaDAO.remover(nova.id);
    console.log('Removida:', removida.nome);

    if (await musicaDAO.buscarPorId(nova.id) !== null) throw new Error('A música removida ainda está no banco');
    if (completa.partes.length !== 2 || editada.id !== nova.id) throw new Error('Resultado diferente do esperado');
    console.log('MusicaDAO OK');
}

testar().catch((erro) => {
    console.error('Falhou:', erro.message);
    process.exit(1);
});
