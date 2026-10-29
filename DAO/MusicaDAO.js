// DAO/MusicaDAO.js
// DAO das músicas, agora com o Supabase. Os métodos têm os MESMOS nomes da etapa 3.
// O que mudou: todos são async (falar com a nuvem leva tempo) e os dados vêm do banco.
const supabase = require('../supabaseClient');
const { Musica } = require('../karaoke/musica');
const { Parte } = require('../karaoke/parte');
const { Artista } = require('../karaoke/artista');
const artistaDAO = require('./ArtistaDAO');
const parteDAO = require('./ParteDAO');

// Colunas que toda consulta de música traz.
// "artista:artistas(id, nome)" = siga a chave estrangeira artista_id até a
// tabela artistas e traga id e nome, com o apelido "artista".
const COLUNAS_MUSICA = 'id, nome, artista:artistas(id, nome)';

class MusicaDAO {

    // Mapeamento: linha do banco → objeto Musica, com um Artista dentro
    _paraMusica(linha) {
        const artista = new Artista(linha.artista.nome, linha.artista.id);
        return new Musica(linha.nome, artista, linha.id);
    }

    // Retorna todas as músicas (sem as partes, só a quantidade de cada uma)
    async listarTodas() {
        const { data, error } = await supabase
            .from('musicas')
            .select(COLUNAS_MUSICA + ', partes(count)')   // o banco conta as partes
            .order('id');

        if (error) throw new Error('Erro ao listar músicas: ' + error.message);

        const musicas = [];
        for (const linha of data) {
            const musica = this._paraMusica(linha);
            musica.totalPartes = linha.partes[0].count;
            musicas.push(musica);
        }
        return musicas;
    }

    // Busca uma música pelo id, com artista e partes (ou null)
    async buscarPorId(id) {
        // "/api/musicas/abc" vira NaN: nem pergunta ao banco
        if (!Number.isInteger(id)) return null;

        const { data, error } = await supabase
            .from('musicas')
            .select(COLUNAS_MUSICA)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new Error('Erro ao buscar música: ' + error.message);
        if (!data) return null;

        const musica = this._paraMusica(data);

        // As partes moram em outra tabela: quem sabe buscá-las é o ParteDAO
        const partes = await parteDAO.listarPorMusica(id);
        for (const parte of partes) {
            musica.addParte(parte);
        }
        return musica;
    }

    // Insere uma música e devolve o objeto criado (com o id gerado pelo banco).
    // O artista chega como TEXTO: se não existir, é criado.
    async inserir(nome, nomeArtista) {
        const artista = await artistaDAO.buscarOuCriar(nomeArtista);

        const { data, error } = await supabase
            .from('musicas')
            .insert({ nome: nome, artista_id: artista.id })
            .select('id, nome')
            .single();

        if (error) throw new Error('Erro ao inserir música: ' + error.message);

        return new Musica(data.nome, artista, data.id);
    }

    // Acrescenta uma Parte a uma música existente (true/false, como antes)
    async adicionarPartes(idMusica, parte) {
        if (!(parte instanceof Parte)) return false;

        const musica = await this.buscarPorId(idMusica);
        if (!musica) return false;

        await parteDAO.inserir(idMusica, parte);
        return true;
    }

    // Altera nome e artista. Muda o VÍNCULO desta música; não renomeia o artista das outras.
    async atualizar(id, nome, nomeArtista) {
        const existente = await this.buscarPorId(id);
        if (!existente) return null;

        const artista = await artistaDAO.buscarOuCriar(nomeArtista);

        const { error } = await supabase
            .from('musicas')
            .update({ nome: nome, artista_id: artista.id })
            .eq('id', id);   // SEM este filtro, TODAS as músicas seriam alteradas

        if (error) throw new Error('Erro ao atualizar música: ' + error.message);

        return this.buscarPorId(id);
    }

    // Remove uma música e devolve a música removida (ou null)
    async remover(id) {
        const musica = await this.buscarPorId(id);
        if (!musica) return null;

        // As partes somem junto: "on delete cascade" na tabela partes (etapa 4)
        const { error } = await supabase
            .from('musicas')
            .delete()
            .eq('id', id);

        if (error) throw new Error('Erro ao remover música: ' + error.message);

        return musica;
    }
}

// Exporta uma INSTÂNCIA única (Padrão Singleton)
module.exports = new MusicaDAO();
