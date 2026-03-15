
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres'
});

async function run() {
  try {
    await client.connect();
    const { rows } = await client.query("SELECT id, status, valor_total FROM public.ibs_pedidos WHERE id::text ILIKE '49e7818d%'");
    console.log('Results in IBS DB (55322):', rows);
    if (rows.length > 0) {
       const { rows: items } = await client.query('SELECT * FROM public.ibs_pedido_itens WHERE pedido_id = $1', [rows[0].id]);
       console.log('Items in IBS DB:', items);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
