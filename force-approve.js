const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Verificar se a tabela existe
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'ibs_perfis'");
    if (tables.rows.length === 0) {
      console.log('Tabela ibs_perfis NÃO existe. Criando...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.ibs_perfis (
          id uuid PRIMARY KEY,
          nome_completo text,
          email text,
          cargo text,
          role text DEFAULT 'USER',
          aprovado boolean DEFAULT false,
          created_at timestamptz DEFAULT now()
        );
      `);
    }

    // 2. Buscar o ID do Thiago
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log('ID do Thiago:', userId);

      // 3. Forçar aprovação total
      await client.query(`
        INSERT INTO public.ibs_perfis (id, email, nome_completo, role, aprovado)
        VALUES ($1, 'thiagomayan@gmail.com', 'Thiago Mayan', 'ADMIN', true)
        ON CONFLICT (id) DO UPDATE SET aprovado = true, role = 'ADMIN';
      `, [userId]);
      console.log('Thiago APROVADO com sucesso.');
    } else {
      console.log('Usuário thiagomayan@gmail.com não encontrado no Auth.');
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
