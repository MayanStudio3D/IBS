const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- EXAMINANDO TABELA "perfis" (DIFERENTE DE "ibs_perfis") ---');
    
    // 1. Listar colunas da tabela perfis
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'perfis'");
    console.log('Colunas de "perfis":', cols.rows.map(r => r.column_name));

    // 2. Listar conteúdo
    const data = await client.query("SELECT * FROM public.perfis");
    console.log('Dados em "perfis":', data.rows);

    // 3. Se o Thiago estiver lá como Vendedor, vamos atualizar!
    for (const row of data.rows) {
        if (row.email && row.email.toLowerCase().includes('thiago')) {
            console.log(`Corrigindo Thiago na tabela "perfis": ${row.email}`);
            
            let updateQuery = "UPDATE public.perfis SET ";
            let updates = [];
            if (cols.rows.some(r => r.column_name === 'cargo')) updates.push("cargo = 'DIRETOR'");
            if (cols.rows.some(r => r.column_name === 'nivel_acesso')) updates.push("nivel_acesso = 'DIRETOR'");
            
            if (updates.length > 0) {
                updateQuery += updates.join(', ') + " WHERE id = '" + row.id + "'";
                await client.query(updateQuery);
                console.log('✅ Atualizado na tabela "perfis".');
            }
        }
    }

  } catch (err) {
    console.error('Erro ao examinar tabela perfis:', err);
  } finally {
    await client.end();
  }
}
run();
