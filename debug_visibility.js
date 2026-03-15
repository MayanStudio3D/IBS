
const { Client } = require('pg');

async function debugPeds() {
  const ibsDb = new Client({ host: '127.0.0.1', port: 55322, user: 'postgres', password: 'postgres', database: 'postgres' });
  await ibsDb.connect();

  console.log('--- Debugging Budgets Visibility ---');
  
  // 1. Total count
  const { rows: total } = await ibsDb.query(`SELECT count(*) FROM ibs_pedidos`);
  console.log('Total in table:', total[0].count);

  // 2. Count NOT deleted
  const { rows: visible } = await ibsDb.query(`SELECT count(*) FROM ibs_pedidos WHERE excluido_em IS NULL`);
  console.log('Count where excluido_em IS NULL:', visible[0].count);

  // 3. Check Vendedor IDs
  const { rows: vids } = await ibsDb.query(`SELECT DISTINCT vendedor_id FROM ibs_pedidos`);
  console.log('Distinct Vendedor IDs in Pedidos:', vids);

  // 4. Check Profils
  const { rows: perfis } = await ibsDb.query(`SELECT id, email, nome_completo, cargo FROM ibs_perfis`);
  console.log('Profiles in ibs_perfis:', perfis);

  // 5. Sample of 1 order
  const { rows: sample } = await ibsDb.query(`SELECT * FROM ibs_pedidos LIMIT 1`);
  console.log('Full sample row:', sample[0]);

  await ibsDb.end();
}

debugPeds();
