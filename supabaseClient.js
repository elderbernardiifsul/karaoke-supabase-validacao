// supabaseClient.js — a conexão com o Supabase, criada UMA vez e usada pelos DAOs.
// Só o servidor usa este arquivo. O navegador (public/) nunca fala com o banco.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SECRET_KEY;

if (!url || !chave || url.includes('SEU-PROJETO') || chave.includes('SUBSTITUA')) {
    throw new Error('Preencham SUPABASE_URL e SUPABASE_SECRET_KEY no .env (ou no ambiente da Render)');
}

const supabase = createClient(url, chave, {
    // Desliga recursos de login de usuário, que só fazem sentido no navegador
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

module.exports = supabase;
