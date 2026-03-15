const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- FORÇANDO CARGO DE DIRETOR EM TODAS AS TABELAS ---');
    
    // 1. Buscar o ID do Thiago
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length === 0) {
      console.log('Usuário não encontrado.');
      return;
    }
    const userId = authRes.rows[0].id;
    console.log('ID do Usuário:', userId);

    // 2. Atualizar em public.ibs_perfis
    console.log('Atualizando ibs_perfis...');
    await client.query(`
      INSERT INTO public.ibs_perfis (id, nome_completo, cargo, role, aprovado)
      VALUES ($1, 'Thiago Mayan', 'DIRETOR', 'ADMIN', true)
      ON CONFLICT (id) DO UPDATE SET 
        cargo = 'DIRETOR', 
        role = 'ADMIN', 
        aprovado = true;
    `, [userId]);

    // 3. Atualizar em public.perfis (se existir colunas compatíveis)
    console.log('Verificando public.perfis...');
    try {
      const perfisCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'perfis'");
      const cols = perfisCols.rows.map(r => r.column_name);
      
      if (cols.length > 0) {
        let updateParts = [];
        if (cols.includes('cargo')) updateParts.push("cargo = 'DIRETOR'");
        if (cols.includes('role')) updateParts.push("role = 'ADMIN'");
        if (cols.includes('nivel_acesso')) updateParts.push("nivel_acesso = 'DIRETOR'");
        
        if (updateParts.length > 0) {
          await client.query(`UPDATE public.perfis SET ${updateParts.join(', ')} WHERE id = $1`, [userId]);
          console.log('✅ Tabela "perfis" atualizada.');
        }
      }
    } catch (e) {
      console.log('Tabela "perfis" não existe ou falhou.');
    }

    // 4. Limpar cache do banco
    await client.query("NOTIFY pgrst, 'reload schema'");
    
    console.log('✅ Operação concluída. Thiago deve ser DIRETOR agora.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
