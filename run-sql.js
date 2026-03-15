const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE public.ibs_perfis ADD COLUMN IF NOT EXISTS telefone text;
      CREATE TABLE IF NOT EXISTS public.ibs_configuracoes (
        id integer PRIMARY KEY DEFAULT 1,
        logo_url text,
        sistema_subtitulo text
      );
      INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
      VALUES (1, '', 'IMPERIAL BARRA STONE')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Success');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
