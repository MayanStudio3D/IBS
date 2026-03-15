
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- CHECKING RLS FOR PEDIDOS AND PEDIDO_ITENS ---');
    
    const { rows: status } = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('ibs_pedidos', 'ibs_pedido_itens');
    `);
    console.log('RLS Status:', status);

    const { rows: policies } = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename IN ('ibs_pedidos', 'ibs_pedido_itens');
    `);
    console.log('Policies:', JSON.stringify(policies, null, 2));

    // Also check current user info
    const { rows: user } = await client.query("SELECT id, cargo, email FROM public.ibs_perfis WHERE email = 'thiagomayan@gmail.com'");
    console.log('User Profile:', user);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}
run();
