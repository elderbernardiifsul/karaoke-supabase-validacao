
class Musica {

    constructor(nome, artista, id) {
        this.id = id || null;   // quem define o id é o DAO (e, mais tarde, o banco)
        this.nome = nome;
        this.artista = artista;   // a partir da etapa 9, um objeto Artista: { id, nome }
        this.partes = []; // associacao com Parte
    }

    //metodos
    addParte(parte) { //parte é objeto de Parte
        if (!parte || !parte.letra || !parte.tempoEspera || !parte.tag) {
            throw new Error('Parte da Musica com problema!');
        }

        this.partes.push(parte);
    }

    getLetraInteira(){
        // this.partes -->todas as partes

        let letra = "";

        this.partes.forEach((parte) => {
            letra += parte.letra;
        });
        return letra;
    }
}

module.exports = {Musica};