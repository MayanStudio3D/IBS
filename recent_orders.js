
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    const { rows } = await client.query("SELECT id, criado_em, status, valor_total FROM public.ibs_pedidos ORDER BY criado_em DESC LIMIT 5");
    console.log('Most recent orders:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
