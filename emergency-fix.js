const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- REPARO DE EMERGÊNCIA: LOGIN E RLS ---');
    
    // 1. Desabilitar RLS temporariamente para garantir que o login funcione
    console.log('Desabilitando RLS na tabela ibs_perfis...');
    await client.query("ALTER TABLE public.ibs_perfis DISABLE ROW LEVEL SECURITY;");
    
    // 2. Garantir que o usuário Thiago está aprovado e existe
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log(`Usuário encontrado: ${userId}.`);
      
      // Upsert garantido
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, aprovado)
        VALUES ($1, 'Thiago Mayan', true)
        ON CONFLICT (id) DO UPDATE SET aprovado = true;
      `, [userId]);
      
      console.log('✅ Thiago aprovado com RLS desabilitado.');
    } else {
      console.log('❌ Usuário não encontrado no Auth.');
    }

    // 3. Verificar Studio (Geralmente 54323 no Supabase local)
    // Não posso ver via PG mas posso sugerir.

    console.log('--- OPERAÇÃO CONCLUÍDA ---');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
