const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Listar colunas reais
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ibs_perfis'");
    console.log('Colunas reais:', cols.rows.map(r => r.column_name));

    // 2. Tentar aprovar usando apenas as colunas que existem
    const hasAprovado = cols.rows.some(r => r.column_name === 'aprovado');
    const hasRole = cols.rows.some(r => r.column_name === 'role');
    
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      
      let query = `INSERT INTO public.ibs_perfis (id`;
      let values = [userId];
      let placeholders = ['$1'];
      let updates = [];

      if (hasAprovado) {
        query += `, aprovado`;
        values.push(true);
        placeholders.push(`$${values.length}`);
        updates.push(`aprovado = true`);
      }
      
      query += `) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`;
      
      await client.query(query, values);
      console.log('Thiago APROVADO com sucesso.');
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
