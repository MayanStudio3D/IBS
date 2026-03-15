
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    const { rows: pedidos } = await client.query("SELECT id, status, valor_total FROM public.ibs_pedidos WHERE id::text ILIKE '%49e7818d%'");
    if (pedidos.length > 0) {
      const p = pedidos[0];
      console.log('PEDIDO:', p);
      const { rows: items } = await client.query('SELECT * FROM public.ibs_pedido_itens WHERE pedido_id = $1', [p.id]);
      console.log('ITEMS:', items);
    } else {
      console.log('Budget with prefix 49e7818d NOT FOUND');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
