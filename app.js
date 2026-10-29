// app.js — o servidor do karaokê: recebe as requisições e pede os dados ao DAO.
// A partir da etapa 10, o DAO fala com o banco: toda chamada a ele usa await.
const express = require('express');
const { Parte } = require('./karaoke/parte');
const musicaDAO = require('./DAO/MusicaDAO');   // atenção às maiúsculas: DAO/MusicaDAO

const app = express();
app.use(express.json());              // lê o corpo JSON das requisições
app.use(express.static('public'));    // entrega index.html, player.js e estilo.css

// Lê nome e artista do corpo; devolve null se algum faltar ou vier vazio
function lerCamposMusica(body) {
    const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
    const artista = typeof body?.artista === 'string' ? body.artista.trim() : '';
    if (!nome || !artista) return null;
    return { nome, artista };
}

// GET /api/musicas — lista todas, sem as partes (só a quantidade)
app.get('/api/musicas', async (req, res, next) => {
    try {
        const musicas = await musicaDAO.listarTodas();
        const resumo = [];
        for (const musica of musicas) {
            resumo.push({
                id: musica.id,
                nome: musica.nome,
                artista: musica.artista,
                totalPartes: musica.totalPartes
            });
        }
        res.json(resumo);
    } catch (erro) {
        next(erro);   // entrega o erro ao middleware do final → 500
    }
});

// GET /api/musicas/:id — uma música, com as partes
app.get('/api/musicas/:id', async (req, res, next) => {
    try {
        const musica = await musicaDAO.buscarPorId(Number(req.params.id));
        if (!musica) return res.status(404).json({ erro: 'Música não encontrada' });
        res.json(musica);
    } catch (erro) {
        next(erro);
    }
});

// POST /api/musicas — cria uma música
app.post('/api/musicas', async (req, res, next) => {
    try {
        const campos = lerCamposMusica(req.body);
        if (!campos) return res.status(400).json({ erro: 'Informe nome e artista' });
        const musica = await musicaDAO.inserir(campos.nome, campos.artista);
        res.status(201).json(musica);
    } catch (erro) {
        next(erro);
    }
});

// PUT /api/musicas/:id — altera nome e artista
app.put('/api/musicas/:id', async (req, res, next) => {
    try {
        const campos = lerCamposMusica(req.body);
        if (!campos) return res.status(400).json({ erro: 'Informe nome e artista' });
        const musica = await musicaDAO.atualizar(Number(req.params.id), campos.nome, campos.artista);
        if (!musica) return res.status(404).json({ erro: 'Música não encontrada' });
        res.json(musica);
    } catch (erro) {
        next(erro);
    }
});

// DELETE /api/musicas/:id — remove uma música (as partes vão junto: cascade)
app.delete('/api/musicas/:id', async (req, res, next) => {
    try {
        const musica = await musicaDAO.remover(Number(req.params.id));
        if (!musica) return res.status(404).json({ erro: 'Música não encontrada' });
        res.json({ mensagem: 'Música removida', musica });
    } catch (erro) {
        next(erro);
    }
});

// POST /api/musicas/:id/partes — acrescenta uma parte (verso, refrão...)
app.post('/api/musicas/:id/partes', async (req, res, next) => {
    try {
        const { letra, tempoEspera, tag } = req.body ?? {};
        if (!letra || !tag || !Number.isInteger(tempoEspera) || tempoEspera <= 0) {
            return res.status(400).json({ erro: 'Informe letra, tag e tempoEspera (inteiro positivo)' });
        }
        const id = Number(req.params.id);
        const adicionou = await musicaDAO.adicionarPartes(id, new Parte(letra, tempoEspera, tag));
        if (!adicionou) return res.status(404).json({ erro: 'Música não encontrada' });
        res.status(201).json(await musicaDAO.buscarPorId(id));
    } catch (erro) {
        next(erro);
    }
});

// Rota da API que não existe → 404 em JSON
app.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// Middleware de erro: o último app.use. Todo erro não tratado chega aqui.
// O console.error é o que aparece nos Logs da Render.
app.use((erro, req, res, next) => {
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    }
    console.error('Erro na API:', erro.message);
    res.status(500).json({ erro: 'Não foi possível concluir a operação' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (erro) => {
    if (erro) {
        console.error(`Não foi possível usar a porta ${PORT}: ${erro.message}`);
        process.exit(1);
    }
    console.log(`Karaokê no ar: http://localhost:${PORT}`);
});
