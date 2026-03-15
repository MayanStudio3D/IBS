
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- REPLICATING THE ENTIRE RLS LOGIC ---');

    // 1. Create a bulletproof is_admin function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.ibs_is_admin()
      RETURNS boolean AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.ibs_perfis 
          WHERE id = auth.uid() AND (cargo = 'ADMIN' OR cargo = 'DIRETOR')
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 2. Drop all policies
    await client.query(`DROP POLICY IF EXISTS "Pedidos owner or admin" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "Pedido itens owner or admin" ON public.ibs_pedido_itens;`);
    await client.query(`DROP POLICY IF EXISTS "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos;`);
    await client.query(`DROP POLICY IF EXISTS "Permitir UPDATE em itens de pedido do usuário" ON public.ibs_pedido_itens;`);

    // 3. New ultra-simple policies
    await client.query(`
      CREATE POLICY "ibs_pedidos_policy" ON public.ibs_pedidos
      FOR ALL TO authenticated
      USING (vendedor_id = auth.uid() OR ibs_is_admin())
      WITH CHECK (vendedor_id = auth.uid() OR ibs_is_admin());
    `);

    await client.query(`
      CREATE POLICY "ibs_pedido_itens_policy" ON public.ibs_pedido_itens
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.ibs_pedidos 
          WHERE id = ibs_pedido_itens.pedido_id 
          AND (vendedor_id = auth.uid() OR ibs_is_admin())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ibs_pedidos 
          WHERE id = ibs_pedido_itens.pedido_id 
          AND (vendedor_id = auth.uid() OR ibs_is_admin())
        )
      );
    `);

    // 4. Ensure RLS is active
    await client.query(`ALTER TABLE public.ibs_pedidos ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.ibs_pedido_itens ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.ibs_pedidos FORCE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.ibs_pedido_itens FORCE ROW LEVEL SECURITY;`);

    console.log('✅ DATABASE RLS POLICIES RECONSTRUCTED.');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}
run();
