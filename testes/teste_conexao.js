// testes/teste_conexao.js — primeiro teste de vida: o Node consegue ler o banco?
// Rodem com: node testes/teste_conexao.js
const supabase = require('../supabaseClient');

async function testar() {
    const { data, error } = await supabase
        .from('musicas')
        .select('id, nome, artista:artistas(nome)')
        .order('id');

    if (error) {
        console.error('Falhou:', error.message);
        process.exit(1);
    }

    console.log('Conexão funcionando. Músicas no banco:', data.length);
    for (const linha of data) {
        console.log('-', linha.id, linha.nome, '—', linha.artista.nome);
    }
}

testar();
