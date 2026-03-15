const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RECONFIGURANDO PERMISSÕES E DADOS ---');
    
    // 1. Alterar a constraint para permitir 'DIRETOR'
    console.log('Atualizando constraint de cargos...');
    await client.query("ALTER TABLE public.ibs_perfis DROP CONSTRAINT IF EXISTS ibs_perfis_cargo_check;");
    await client.query("ALTER TABLE public.ibs_perfis ADD CONSTRAINT ibs_perfis_cargo_check CHECK (cargo = ANY (ARRAY['ADMIN'::text, 'VENDEDOR'::text, 'DIRETOR'::text]));");

    // 2. Buscar o ID do Thiago (pode ser o .com ou qualquer um que ele esteja usando)
    const authUsers = await client.query("SELECT id, email FROM auth.users WHERE email ILIKE 'thiagomayan%'");
    
    for (const user of authUsers.rows) {
      console.log(`Atualizando usuário: ${user.email} para DIRETOR...`);
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, cargo, aprovado)
        VALUES ($1, 'Thiago Mayan', 'DIRETOR', true)
        ON CONFLICT (id) DO UPDATE SET 
            nome_completo = 'Thiago Mayan',
            cargo = 'DIRETOR', 
            aprovado = true;
      `, [user.id]);
    }

    // 3. Garantir que a tabela ibs_clientes existe e o cache está limpo
    console.log('Verificando tabela ibs_clientes...');
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

    // 4. Reload PostgREST cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    
    console.log('✅ TUDO PRONTO! Verifique novamente.');

  } catch (err) {
    console.error('Erro no reparo final:', err);
  } finally {
    await client.end();
  }
}
run();
