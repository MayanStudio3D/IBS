const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    const config = await client.query("SELECT * FROM public.ibs_configuracoes WHERE id = 1");
    console.log('Configurações atuais:', config.rows);

    if (config.rows.length === 0 || !config.rows[0].logo_url) {
        console.log('Restaurando configurações padrão...');
        await client.query(`
            INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
            VALUES (1, 'https://zntofmbeuayjuhbeaqyz.supabase.co/storage/v1/object/public/ibs_public/logo_imperial.png', 'IMPERIAL BARRA STONE')
            ON CONFLICT (id) DO UPDATE SET 
              logo_url = 'https://zntofmbeuayjuhbeaqyz.supabase.co/storage/v1/object/public/ibs_public/logo_imperial.png',
              sistema_subtitulo = 'IMPERIAL BARRA STONE';
        `);
        console.log('Restaurado.');
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
