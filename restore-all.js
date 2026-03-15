const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RESTAURANDO CONFIGURAÇÕES E MATERIAIS ---');
    
    // 1. Restaurar Configurações (Logo e Subtítulo)
    // Usando a logo que o usuário enviou e o nome da empresa
    const logoUrl = 'https://zntofmbeuayjuhbeaqyz.supabase.co/storage/v1/object/public/ibs_public/logo_imperial.png';
    const subtitulo = 'IMPERIAL BARRA STONE';

    console.log('Restaurando ibs_configuracoes...');
    await client.query(`
      INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
      VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET 
        logo_url = $1, 
        sistema_subtitulo = $2;
    `, [logoUrl, subtitulo]);

    // 2. Tentar recuperar materiais órfãos
    // Como deletamos e recriamos o usuário, os materiais antigos podem estar sem dono
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authRes.rows.length > 0) {
      const currentId = authRes.rows[0].id;
      
      // Lista de tabelas que podem conter materiais ou produtos
      const tables = ['materiais', 'produto_materiais', 'produtos', 'ibs_estoque'];
      
      for (const table of tables) {
        try {
          // Verificar se a tabela tem alguma coluna de ID de usuário
          const colsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
          const columns = colsRes.rows.map(r => r.column_name);
          const idCol = columns.find(c => c === 'user_id' || c === 'usuario_id' || c === 'criado_por');
          
          if (idCol) {
            console.log(`Migrando registros órfãos na tabela ${table}...`);
            await client.query(`UPDATE public.${table} SET ${idCol} = $1 WHERE ${idCol} IS NULL OR ${idCol} != $1`, [currentId]);
          }
        } catch (e) {
          // Ignorar se a tabela não existir
        }
      }
    }

    // 3. Notificar reload do cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Configurações e materiais restaurados.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
