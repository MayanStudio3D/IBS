
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- REPAIRING RLS FOR PEDIDOS ---');

    // 1. Drop existing problematic policies
    await client.query(`DROP POLICY IF EXISTS "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "Permitir UPDATE em itens de pedido do usuário" ON public.ibs_pedido_itens;`);
    await client.query(`DROP POLICY IF EXISTS "Permitir tudo para ADMIN em pedidos" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "Vendedores gerenciam seus pedidos" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "ADMIN gerencia tudo em pedidos" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "Itens seguem pedidos" ON public.ibs_pedido_itens;`);

    // 2. Create robust policies for ibs_pedidos
    // Allow select for owner or admin
    await client.query(`
      CREATE POLICY "Pedidos owner or admin" ON public.ibs_pedidos
      FOR ALL
      USING (vendedor_id = auth.uid() OR (SELECT cargo FROM ibs_perfis WHERE id = auth.uid()) = 'ADMIN')
      WITH CHECK (vendedor_id = auth.uid() OR (SELECT cargo FROM ibs_perfis WHERE id = auth.uid()) = 'ADMIN');
    `);

    // 3. Create robust policies for ibs_pedido_itens
    // This is the tricky part, it needs to check the parent pedido
    await client.query(`
      CREATE POLICY "Pedido itens owner or admin" ON public.ibs_pedido_itens
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM ibs_pedidos p 
          WHERE p.id = ibs_pedido_itens.pedido_id 
          AND (p.vendedor_id = auth.uid() OR (SELECT cargo FROM ibs_perfis WHERE id = auth.uid()) = 'ADMIN')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM ibs_pedidos p 
          WHERE p.id = ibs_pedido_itens.pedido_id 
          AND (p.vendedor_id = auth.uid() OR (SELECT cargo FROM ibs_perfis WHERE id = auth.uid()) = 'ADMIN')
        )
      );
    `);

    // 4. Just in case, enable RLS
    await client.query(`ALTER TABLE public.ibs_pedidos ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.ibs_pedido_itens ENABLE ROW LEVEL SECURITY;`);

    // 5. Force Thiago to be ADMIN again
    // Finding user by id or email via auth.users join
    await client.query(`
      UPDATE ibs_perfis 
      SET cargo = 'ADMIN', aprovado = true 
      WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'
      );
    `);

    console.log('✅ RLS REPAIRED FOR PEDIDOS AND ITENS.');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}
run();
