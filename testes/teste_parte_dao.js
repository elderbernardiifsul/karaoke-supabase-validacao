// testes/teste_parte_dao.js — confere o ParteDAO com as partes da amostra.
// Rodem com: node testes/teste_parte_dao.js
const supabase = require('../supabaseClient');
const parteDAO = require('../DAO/ParteDAO');

async function testar() {
    // Descobre o id da música de amostra (o id muda de um banco para outro)
    const { data: musica, error } = await supabase
        .from('musicas')
        .select('id')
        .eq('nome', 'Encontro da turma')
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!musica) throw new Error('A música de amostra não está no banco: rodem o sql/seed.sql');

    const partes = await parteDAO.listarPorMusica(musica.id);
    for (const parte of partes) {
        console.log(parte.ordem, parte.tag, parte.tempoEspera, parte.letra);
    }
    if (partes.length !== 2 || partes[0].ordem !== 0 || partes[1].ordem !== 1) {
        throw new Error('Esperava 2 partes, na ordem 0 e 1');
    }
    if (partes[0].tempoEspera !== 1200) {
        throw new Error('tempo_espera não virou tempoEspera: confiram o _paraParte');
    }
    console.log('ParteDAO OK');
}

testar().catch((erro) => {
    console.error('Falhou:', erro.message);
    process.exit(1);
});
