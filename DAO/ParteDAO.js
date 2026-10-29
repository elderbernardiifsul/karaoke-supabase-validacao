// DAO/ParteDAO.js
// DAO da tabela "partes": versos e refrões de cada música.
const supabase = require('../supabaseClient');
const { Parte } = require('../karaoke/parte');

class ParteDAO {

    // Mapeamento: linha do banco (snake_case) → objeto Parte (camelCase).
    // É aqui que tempo_espera vira tempoEspera, e o player continua funcionando.
    _paraParte(linha) {
        const parte = new Parte(linha.letra, linha.tempo_espera, linha.tag);
        parte.id = linha.id;
        parte.ordem = linha.ordem;
        return parte;
    }

    // Retorna as partes de uma música, NA ORDEM em que devem ser cantadas
    async listarPorMusica(idMusica) {
        const { data, error } = await supabase
            .from('partes')
            .select('id, ordem, letra, tempo_espera, tag')
            .eq('musica_id', idMusica)
            .order('ordem');   // sem isto, o banco pode devolver fora de ordem

        if (error) throw new Error('Erro ao listar partes: ' + error.message);

        const partes = [];
        for (const linha of data) {
            partes.push(this._paraParte(linha));
        }
        return partes;
    }

    // Insere uma Parte no FINAL da música e retorna a parte criada
    async inserir(idMusica, parte) {
        // 1. Descobre a última parte da música (a de maior ordem)
        const { data: ultima, error: erroUltima } = await supabase
            .from('partes')
            .select('ordem')
            .eq('musica_id', idMusica)
            .order('ordem', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (erroUltima) throw new Error('Erro ao consultar partes: ' + erroUltima.message);

        // Música sem partes → a nova tem ordem 0; senão, a próxima depois da última
        let proximaOrdem = 0;
        if (ultima) {
            proximaOrdem = ultima.ordem + 1;
        }

        // 2. Grava a parte. Mapeamento inverso: camelCase → snake_case
        const { data, error } = await supabase
            .from('partes')
            .insert({
                musica_id: idMusica,
                ordem: proximaOrdem,
                letra: parte.letra,
                tempo_espera: parte.tempoEspera,
                tag: parte.tag
            })
            .select('id, ordem, letra, tempo_espera, tag')
            .single();

        if (error) throw new Error('Erro ao inserir parte: ' + error.message);

        return this._paraParte(data);
    }
}

// Exporta uma INSTÂNCIA única (Padrão Singleton)
module.exports = new ParteDAO();
