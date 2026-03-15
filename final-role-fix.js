const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Verificar colunas reais de novo
    const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ibs_perfis'");
    const columns = colsRes.rows.map(r => r.column_name);
    console.log('Colunas reais:', columns);

    const hasCargo = columns.includes('cargo');
    const hasRole = columns.includes('role');
    const hasAprovado = columns.includes('aprovado');

    // 2. Buscar Thiago no Auth
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log(`Atualizando Thiago (${userId})...`);

      let query = `INSERT INTO public.ibs_perfis (id, nome_completo`;
      let vals = [userId, 'Thiago Mayan'];
      let placeholders = ['$1', '$2'];
      let updates = [`nome_completo = $2`];

      if (hasCargo) {
        query += `, cargo`;
        vals.push('DIRETOR');
        placeholders.push(`$${vals.length}`);
        updates.push(`cargo = $${vals.length}`);
      }
      if (hasRole) {
        query += `, role`;
        vals.push('ADMIN');
        placeholders.push(`$${vals.length}`);
        updates.push(`role = $${vals.length}`);
      }
      if (hasAprovado) {
        query += `, aprovado`;
        vals.push(true);
        placeholders.push(`$${vals.length}`);
        updates.push(`aprovado = $${vals.length}`);
      }

      query += `) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`;

      await client.query(query, vals);
      console.log('✅ Perfil atualizado com sucesso.');
    }

    await client.query("NOTIFY pgrst, 'reload schema'");

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
