const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Garantir que o perfil existe e está aprovado
    console.log('Verificando perfil do admin...');
    const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    
    if (authRes.rows.length > 0) {
      const userId = authRes.rows[0].id;
      console.log('Usuário Thiago encontrado no Auth:', userId);
      
      await client.query(`
        INSERT INTO public.ibs_perfis (id, nome_completo, email, cargo, role, aprovado)
        VALUES ($1, 'Thiago Mayan', 'thiagomayan@gmail.com', 'DIRETOR', 'ADMIN', true)
        ON CONFLICT (id) DO UPDATE SET aprovado = true, role = 'ADMIN';
      `, [userId]);
      
      console.log('Thiago Mayan aprovado no banco de dados.');
    } else {
      console.log('❌ Thiago ainda não está no Auth. Por favor, cadastre-se na tela de registro primeiro.');
    }

    // 2. Definir a logo definitiva na tabela de configurações
    // Usando a logo do storage local ou link direto se preferir
    const standardLogo = '/logo-ibs.png'; // Definiremos este como o padrão no código também
    
    console.log('Configurando logo definitiva...');
    await client.query(`
      INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
      VALUES (1, $1, 'IMPERIAL BARRA STONE')
      ON CONFLICT (id) DO UPDATE SET logo_url = $1;
    `, [standardLogo]);
    
    console.log('Logo configurada como:', standardLogo);

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
