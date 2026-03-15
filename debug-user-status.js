const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RELATÓRIO DE STATUS DO USUÁRIO ---');
    
    // 1. Verificar na auth.users
    const authUser = await client.query("SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    if (authUser.rows.length === 0) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO NO AUTH (auth.users).');
      console.log('   Dica: Você precisa criar a conta na tela de registro primeiro.');
    } else {
      const user = authUser.rows[0];
      console.log(`✅ USUÁRIO NO AUTH ENCONTRADO!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Criado em: ${user.created_at}`);

      // 2. Verificar na public.ibs_perfis
      const profile = await client.query("SELECT * FROM public.ibs_perfis WHERE id = $1", [user.id]);
      if (profile.rows.length === 0) {
        console.log('❌ PERFIL NÃO ENCONTRADO NA TABELA public.ibs_perfis.');
        console.log('   Ação: Criando perfil AGORA e aprovando...');
        await client.query(`
          INSERT INTO public.ibs_perfis (id, nome_completo, aprovado)
          VALUES ($1, 'Thiago Mayan', true)
        `, [user.id]);
        console.log('   ✅ Perfil criado e aprovado!');
      } else {
        const perf = profile.rows[0];
        console.log(`✅ PERFIL ENCONTRADO NA TABELA public.ibs_perfis!`);
        console.log(`   Aprovado: ${perf.aprovado}`);
        
        if (!perf.aprovado) {
          console.log('   Ação: Forçando aprovação para TRUE...');
          await client.query("UPDATE public.ibs_perfis SET aprovado = true WHERE id = $1", [user.id]);
          console.log('   ✅ Status atualizado para APROVADO!');
        }
      }
    }
    
    console.log('--- FIM DO RELATÓRIO ---');

  } catch (err) {
    console.error('Erro na verificação:', err);
  } finally {
    await client.end();
  }
}
run();
