const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- VERIFICANDO MATERIAIS ---');
    
    const mat = await client.query("SELECT COUNT(*) FROM public.materiais");
    console.log('Total de materiais:', mat.rows[0].count);

    const prods = await client.query("SELECT COUNT(*) FROM public.produtos");
    console.log('Total de produtos:', prods.rows[0].count);

    const authRes = await client.query("SELECT id FROM auth.users");
    console.log('Usuários IDs:', authRes.rows.map(r => r.id));

    // Listar alguns materiais para ver o dono
    const sample = await client.query("SELECT id, nome, user_id FROM public.materiais LIMIT 5");
    console.log('Amostra de materiais:', sample.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
