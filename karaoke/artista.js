// karaoke/artista.js — um artista do repertório (tabela artistas)
class Artista {
    constructor(nome, id) {
        this.id = id || null;
        this.nome = nome;
    }
}

module.exports = { Artista };
