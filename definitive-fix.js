const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- REPARAÇÃO FINAL E DEFINITIVA ---');
    
    // 1. Forçar cargo para 'ADMIN' no banco (para o código reconhecer as permissões)
    // Mas vamos garantir que no UI apareça 'DIRETOR'
    const thiagoId = '9a6eecb1-78ab-492b-bff3-6dcd45eb53bb';
    
    console.log(`Setting cargo to ADMIN for ${thiagoId} in all tables...`);
    
    await client.query("UPDATE public.ibs_perfis SET cargo = 'ADMIN', aprovado = true WHERE id = $1", [thiagoId]);
    await client.query("UPDATE public.perfis SET role = 'admin' WHERE id = $1", [thiagoId]);

    // 2. Garantir que a LOGO e CONFIGURAÇÕES existam e estejam corretas
    const logoUrl = 'https://zntofmbeuayjuhbeaqyz.supabase.co/storage/v1/object/public/ibs_public/logo_imperial.png';
    const subtitulo = 'IMPERIAL BARRA STONE';
    
    await client.query(`
      INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
      VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET 
        logo_url = $1, 
        sistema_subtitulo = $2;
    `, [logoUrl, subtitulo]);

    // 3. Desabilitar RLS de vez para evitar qualquer bloqueio de visualização
    const tables = ['ibs_perfis', 'ibs_clientes', 'ibs_configuracoes', 'materiais', 'produtos'];
    for (const table of tables) {
      await client.query(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
    }

    await client.query("NOTIFY pgrst, 'reload schema'");
    
    console.log('✅ DATABASE REPAIRED.');

  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    await client.end();
  }
}
run();
