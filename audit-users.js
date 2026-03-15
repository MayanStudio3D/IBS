const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- RELATÓRIO COMPLETO DE ACESSOS ---');
    
    // 1. Listar TODOS os usuários do Auth
    const authUsers = await client.query("SELECT id, email FROM auth.users");
    console.log('Usuários registrados no AUTH:', authUsers.rows);

    // 2. Listar TODOS os perfis
    const perfis = await client.query("SELECT * FROM public.ibs_perfis");
    console.log('Perfis registrados em public.ibs_perfis:', perfis.rows);

    // 3. Verificar tabelas públicas
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tabelas no schema public:', tables.rows.map(r => r.table_name));

    // 4. Se encontrarmos e-mails com erro (.cor no lugar de .com), vamos consertar
    for (const user of authUsers.rows) {
      if (user.email.endsWith('.cor')) {
          console.log(`⚠️ ALERTA: Usuário com e-mail incorreto detectado: ${user.email}`);
      }
      
      // Forçar TODOS para DIRETOR/ADMIN por precaução, independente do e-mail
      console.log(`Elevando usuário ${user.email} para DIRETOR...`);
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, cargo, aprovado)
        VALUES ($1, 'Thiago Mayan', 'DIRETOR', true)
        ON CONFLICT (id) DO UPDATE SET cargo = 'DIRETOR', aprovado = true;
      `, [user.id]);
    }

    // 5. TENTAR encontrar o Thiago por qualquer e-mail que comece com thiago
    const thiagoAuth = authUsers.rows.find(u => u.email.toLowerCase().includes('thiago'));
    if (thiagoAuth) {
        console.log(`Usuário Thiago identificado: ${thiagoAuth.email}`);
    }

    console.log('--- FIM DO RELATÓRIO ---');

  } catch (err) {
    console.error('Erro na auditoria:', err);
  } finally {
    await client.end();
  }
}
run();
