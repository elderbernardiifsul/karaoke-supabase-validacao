// karaoke/parte.js — um trecho da letra (tabela partes)
class Parte {
    constructor(letra, tempoEspera, tag) {
        this.id = null;      // definido pelo banco
        this.ordem = null;   // posição na música: 0, 1, 2...
        this.letra = letra;
        this.tempoEspera = tempoEspera;
        this.tag = tag;
    }
}

module.exports = { Parte };
