const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- DESABILITANDO RLS GERAL PARA TESTE ---');
    
    const tables = ['ibs_perfis', 'ibs_clientes', 'ibs_configuracoes', 'materiais', 'produtos'];
    
    for (const table of tables) {
        console.log(`Desabilitando RLS na tabela ${table}...`);
        await client.query(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
    }

    console.log('✅ RLS desabilitado nas tabelas críticas.');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
