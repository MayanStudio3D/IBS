const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Corrigir a tabela ibs_perfis removendo a tentativa de inserir 'email' se não existir
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log('ID do Thiago:', userId);

      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, role, aprovado)
        VALUES ($1, 'Thiago Mayan', 'ADMIN', true)
        ON CONFLICT (id) DO UPDATE SET aprovado = true, role = 'ADMIN';
      `, [userId]);
      console.log('Thiago APROVADO com sucesso no banco de dados.');
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
