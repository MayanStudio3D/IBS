const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- BUSCA PROFUNDA POR TYPOS NO EMAIL ---');
    
    // 1. Buscar todos os usuários no Auth
    const authRes = await client.query("SELECT id, email FROM auth.users");
    console.log('Todos os e-mails no Auth:', authRes.rows.map(r => r.email));

    // 2. Buscar no ibs_perfis
    const perfisRes = await client.query("SELECT id, cargo, aprovado FROM public.ibs_perfis");
    console.log('Perfis no ibs_perfis:', perfisRes.rows);

    // 3. Forçar o ID que estiver com "gmail.cor" (se existir) para ADMIN
    for (const user of authRes.rows) {
      if (user.email.includes('thiagomayan')) {
          console.log(`ELEVANDO ID ${user.id} (${user.email}) para ADMIN/DIRETOR...`);
          await client.query(`
            INSERT INTO public.ibs_perfis (id, nome_completo, cargo, aprovado, telefone)
            VALUES ($1, 'Thiago Mayan', 'ADMIN', true, '(71) 99207-2318')
            ON CONFLICT (id) DO UPDATE SET 
                cargo = 'ADMIN', 
                aprovado = true,
                nome_completo = 'Thiago Mayan';
          `, [user.id]);
          
          // E também na tabela 'perfis' que é usada no ERP-3D/outro
          try {
            await client.query("UPDATE public.perfis SET role = 'admin' WHERE id = $1", [user.id]);
          } catch(e) {}
      }
    }

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Sincronização concluída para todos os e-mails thiagomayan.');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
