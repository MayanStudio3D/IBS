const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RECONSTRUINDO TABELA DE CLIENTES ---');
    
    // 1. Criar a tabela ibs_clientes se ela sumiu ou está inacessível
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ibs_clientes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome_completo text NOT NULL,
        email text,
        telefone text,
        cpf_cnpj text,
        cep text,
        logradouro text,
        numero text,
        complemento text,
        bairro text,
        cidade text,
        estado text,
        criado_por uuid REFERENCES auth.users(id),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);
    
    // 2. Tentar recuperar dados da tabela 'clientes' (caso o nome tenha mudado)
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'clientes'");
    if (tablesRes.rows.length > 0) {
      console.log('Migrando dados da tabela "clientes" para "ibs_clientes"...');
      await client.query(`
        INSERT INTO public.ibs_clientes (nome_completo, email, telefone, cpf_cnpj, cep, logradouro, numero, complemento, bairro, cidade, estado)
        SELECT nome_completo, email, telefone, cpf_cnpj, cep, logradouro, numero, complemento, bairro, cidade, estado 
        FROM public.clientes
        ON CONFLICT DO NOTHING;
      `);
    }

    // 3. Forçar recarregamento do PostgREST
    await client.query("NOTIFY pgrst, 'reload schema'");
    
    console.log('✅ Tabela de clientes reconstruída e cache limpo.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
