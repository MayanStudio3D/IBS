const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RESTAURANDO CARGO "ADMIN" PARA ACESSO TOTAL ---');
    
    const authUsers = await client.query("SELECT id FROM auth.users WHERE email ILIKE 'thiagomayan%'");
    
    for (const user of authUsers.rows) {
      console.log(`Atualizando usuário: ${user.id} para ADMIN...`);
      await client.query(`
        UPDATE public.ibs_perfis 
        SET cargo = 'ADMIN', aprovado = true 
        WHERE id = $1
      `, [user.id]);
    }

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Cargo restaurado para ADMIN.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
