
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    const { rows: report } = await client.query(`
      SELECT 
        p.id, 
        p.status, 
        p.valor_total, 
        COUNT(i.id) as item_count 
      FROM public.ibs_pedidos p
      LEFT JOIN public.ibs_pedido_itens i ON p.id = i.pedido_id
      GROUP BY p.id, p.status, p.valor_total
    `);
    console.table(report);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
