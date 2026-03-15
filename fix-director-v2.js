const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RELATÓRIO DE COLUNAS ---');
    
    const tables = ['ibs_perfis', 'perfis'];
    for (const table of tables) {
      const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Tabela ${table}:`, res.rows.map(r => r.column_name));
    }

    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    const userId = authRes.rows[0].id;

    // Atualizar ibs_perfis
    console.log('Atualizando ibs_perfis...');
    await client.query(`
      UPDATE public.ibs_perfis 
      SET cargo = 'DIRETOR', aprovado = true 
      WHERE id = $1
    `, [userId]);

    // Atualizar perfis (se existir cargo)
    console.log('Atualizando perfis...');
    try {
      await client.query(`
        UPDATE public.perfis 
        SET cargo = 'DIRETOR' 
        WHERE id = $1
      `, [userId]);
    } catch (e) {}

    console.log('✅ Tudo atualizado para DIRETOR.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
