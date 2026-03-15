const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- BUSCANDO USUÁRIOS COM TYPOS ---');
    
    // 1. Buscar no Auth todos que comecem com thiagomayan
    const authRes = await client.query("SELECT id, email FROM auth.users WHERE email ILIKE 'thiagomayan%'");
    console.log('Usuários no Auth:', authRes.rows);

    // 2. Buscar no Perfis
    const perfisRes = await client.query("SELECT id, email, cargo, role FROM public.ibs_perfis");
    console.log('Perfis na tabela public.ibs_perfis:', perfisRes.rows);

    // 3. Forçar o update para Diretor/Admin em TODOS que encontrarmos do Thiago
    for (const user of authRes.rows) {
      console.log(`Corrigindo usuário: ${user.email} (${user.id})`);
      
      // Update ou Insert no perfil
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, cargo, role, aprovado)
        VALUES ($1, 'Thiago Mayan', 'DIRETOR', 'ADMIN', true)
        ON CONFLICT (id) DO UPDATE SET 
          cargo = 'DIRETOR', 
          role = 'ADMIN', 
          aprovado = true;
      `, [user.id]);
    }

    // 4. Reload Schema Cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Schema reload notificado.');

    console.log('--- OPERAÇÃO CONCLUÍDA ---');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
