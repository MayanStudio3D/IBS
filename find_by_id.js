
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    // Search for the prefix in all possible IDs
    const { rows } = await client.query("SELECT id, status, valor_total FROM public.ibs_pedidos WHERE id::text LIKE '49e7818d%'");
    console.log('Results:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
