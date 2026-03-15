const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('Verificando tabelas...');
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tabelas encontradas:', tablesRes.rows.map(r => r.table_name));

    const hasProfiles = tablesRes.rows.some(r => r.table_name === 'ibs_perfis');

    if (!hasProfiles) {
      console.log('Criando tabela ibs_perfis...');
      await client.query(`
        CREATE TABLE public.ibs_perfis (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          nome_completo text,
          email text,
          cargo text,
          role text DEFAULT 'USER',
          aprovado boolean DEFAULT false,
          avatar_url text,
          telefone text,
          created_at timestamptz DEFAULT now()
        );
      `);
      console.log('Tabela criada.');
    } else {
      console.log('Tabela ibs_perfis já existe.');
    }

    // Tentar encontrar o usuário Thiago e aprovar se ele existir no Auth mas não no Perfil
    console.log('Buscando Thiago no auth...');
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log('Usuário Thiago encontrado no Auth:', userId);
      
      // Upsert no perfil
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, email, cargo, role, aprovado)
        VALUES ($1, 'Thiago Mayan', 'thiagomayan@gmail.com', 'DIRETOR', 'ADMIN', true)
        ON CONFLICT (id) DO UPDATE SET aprovado = true, role = 'ADMIN';
      `, [userId]);
      
      console.log('Thiago Mayan aprovado e configurado como ADMIN.');
    } else {
      console.log('Thiago ainda não se cadastrou ou foi deletado.');
    }

    // Refresh PostgREST cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Cache do schema notificado para recarregar.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
