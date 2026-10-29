// DAO/ArtistaDAO.js
// DAO da tabela "artistas": o único lugar do projeto que sabe como os artistas são guardados.
const supabase = require('../supabaseClient');
const { Artista } = require('../karaoke/artista');

class ArtistaDAO {

    // Mapeamento: transforma uma LINHA da tabela (objeto simples vindo do banco)
    // em um OBJETO da classe Artista.
    _paraArtista(linha) {
        return new Artista(linha.nome, linha.id);
    }

    // Retorna todos os artistas, em ordem alfabética
    async listarTodos() {
        const { data, error } = await supabase
            .from('artistas')
            .select('id, nome')
            .order('nome');

        if (error) throw new Error('Erro ao listar artistas: ' + error.message);

        const artistas = [];
        for (const linha of data) {
            artistas.push(this._paraArtista(linha));
        }
        return artistas;
    }

    // Busca um artista pelo id (ou null)
    async buscarPorId(id) {
        const { data, error } = await supabase
            .from('artistas')
            .select('id, nome')
            .eq('id', id)
            .maybeSingle();   // 1 linha → objeto; 0 linhas → null

        if (error) throw new Error('Erro ao buscar artista: ' + error.message);
        if (!data) return null;

        return this._paraArtista(data);
    }

    // Busca um artista pelo nome exato (ou null)
    async buscarPorNome(nome) {
        const { data, error } = await supabase
            .from('artistas')
            .select('id, nome')
            .eq('nome', nome)
            .maybeSingle();

        if (error) throw new Error('Erro ao buscar artista: ' + error.message);
        if (!data) return null;

        return this._paraArtista(data);
    }

    // Insere um artista e devolve o objeto criado (com o id gerado pelo banco)
    async inserir(nome) {
        const { data, error } = await supabase
            .from('artistas')
            .insert({ nome: nome })
            .select('id, nome')   // sem este select, o insert não devolve a linha criada
            .single();

        if (error) throw new Error('Erro ao inserir artista: ' + error.message);

        return this._paraArtista(data);
    }

    // Devolve o artista com esse nome; se ainda não existe, cria.
    // É o que permite a API continuar recebendo o artista como texto.
    async buscarOuCriar(nome) {
        const existente = await this.buscarPorNome(nome);
        if (existente) return existente;

        return this.inserir(nome);
    }
}

// Exporta uma INSTÂNCIA única (Singleton)
module.exports = new ArtistaDAO();
