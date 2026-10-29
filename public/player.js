// public/player.js — o player no navegador.
// Conversa com a API pelo fetch; nunca fala direto com o banco.

const listaEl = document.getElementById('listaMusicas');
const mensagemEl = document.getElementById('mensagem');
const nomeEl = document.getElementById('nomeMusica');
const artistaEl = document.getElementById('artista');
const tagEl = document.getElementById('tag');
const letraEl = document.getElementById('letra');
const contadorEl = document.getElementById('contador');
const btnTocar = document.getElementById('btnTocar');

let musicaAtual = null;   // a música escolhida, com as partes
let tocando = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Busca a lista na API e monta um <li> por música
async function carregarPlaylist() {
    try {
        const resposta = await fetch('/api/musicas');
        if (!resposta.ok) throw new Error('a API respondeu ' + resposta.status);
        const musicas = await resposta.json();

        listaEl.innerHTML = '';   // limpa antes de redesenhar
        for (const musica of musicas) {
            const item = document.createElement('li');
            item.textContent = musica.nome + ' — ' + musica.artista.nome;
            item.addEventListener('click', () => escolherMusica(musica.id));
            listaEl.appendChild(item);
        }
        mensagemEl.textContent = musicas.length === 0 ? 'Nenhuma música cadastrada.' : '';
    } catch (erro) {
        mensagemEl.textContent = 'Não foi possível carregar as músicas: ' + erro.message;
    }
}

// Busca a música completa (com partes) e prepara o palco
async function escolherMusica(id) {
    if (tocando) return;   // não troca de música no meio da reprodução
    try {
        const resposta = await fetch('/api/musicas/' + id);
        if (!resposta.ok) throw new Error('a API respondeu ' + resposta.status);
        musicaAtual = await resposta.json();

        nomeEl.textContent = musicaAtual.nome;
        artistaEl.textContent = musicaAtual.artista.nome;
        tagEl.textContent = '';
        contadorEl.textContent = '';
        if (musicaAtual.partes.length === 0) {
            letraEl.textContent = 'Esta música ainda não tem partes para reprodução.';
            btnTocar.disabled = true;
        } else {
            letraEl.textContent = '';
            btnTocar.disabled = false;
        }
    } catch (erro) {
        musicaAtual = null;
        btnTocar.disabled = true;
        mensagemEl.textContent = 'Não foi possível abrir a música: ' + erro.message;
    }
}

// Percorre as partes, esperando o tempo de cada uma
async function tocar() {
    if (!musicaAtual || musicaAtual.partes.length === 0) return;
    tocando = true;
    btnTocar.disabled = true;
    const total = musicaAtual.partes.length;
    for (let i = 0; i < total; i++) {
        const parte = musicaAtual.partes[i];
        tagEl.textContent = parte.tag;
        letraEl.textContent = parte.letra;
        contadorEl.textContent = 'Parte ' + (i + 1) + ' de ' + total;
        await sleep(parte.tempoEspera);
    }
    tagEl.textContent = '';
    letraEl.textContent = 'Fim da música.';
    contadorEl.textContent = '';
    tocando = false;
    btnTocar.disabled = false;
}

btnTocar.addEventListener('click', tocar);
carregarPlaylist();
