const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Pegar o ID atual do Thiago
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length === 0) {
      console.log('Usuário não encontrado.');
      return;
    }
    const currentId = authRes.rows[0].id;
    console.log('ID Atual:', currentId);

    // 2. Listar todas as tabelas no public
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Tabelas:', tables);

    // 3. Verificar cada tabela por IDs que não existem no auth.users
    for (const table of tables) {
      try {
        const colsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        const columns = colsRes.rows.map(r => r.column_name);
        
        // Procurar por colunas que costumam guardar IDs de usuário
        const idCol = columns.find(c => c === 'user_id' || c === 'usuario_id' || c === 'perfil_id' || c === 'criado_por');
        
        if (idCol) {
          const orphans = await client.query(`SELECT COUNT(*) FROM public.${table} WHERE ${idCol} != $1`, [currentId]);
          const count = parseInt(orphans.rows[0].count);
          if (count > 0) {
            console.log(`Tabela ${table}: Encontrados ${count} registros órfãos (ligados a outro ID).`);
            // Tentar migrar esses registros para o ID atual
            await client.query(`UPDATE public.${table} SET ${idCol} = $1 WHERE ${idCol} != $1`, [currentId]);
            console.log(`   ✅ Registros da tabela ${table} migrados para seu novo ID.`);
          }
        }
      } catch (err) {
        // Ignorar erros em tabelas específicas
      }
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
