// testes/teste_artista_dao.js — confere o ArtistaDAO direto no banco.
// Rodem com: node testes/teste_artista_dao.js
const artistaDAO = require('../DAO/ArtistaDAO');

async function testar() {
    const artistas = await artistaDAO.listarTodos();
    console.log('Artistas no banco:', artistas.length);

    // O artista da amostra já existe: buscarOuCriar deve ENCONTRAR, não criar outro
    const primeiro = await artistaDAO.buscarOuCriar('Turma de Programação III');
    const segundo = await artistaDAO.buscarOuCriar('Turma de Programação III');
    console.log('buscarOuCriar devolveu os ids', primeiro.id, 'e', segundo.id);
    if (primeiro.id !== segundo.id) {
        throw new Error('buscarOuCriar criou um artista repetido');
    }

    const porId = await artistaDAO.buscarPorId(primeiro.id);
    console.log('buscarPorId encontrou:', porId.nome);
    console.log('ArtistaDAO OK');
}

testar().catch((erro) => {
    console.error('Falhou:', erro.message);
    process.exit(1);
});
