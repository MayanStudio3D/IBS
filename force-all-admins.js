const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- FORÇANDO TODOS OS USUÁRIOS THIAGO PARA ADMIN ---');
    
    const users = [
        '8759c3db-a847-4d9d-b7d3-9fcba55c768c',
        '9a6eecb1-78ab-492b-bff3-6dcd45eb53bb'
    ];

    for (const id of users) {
        console.log(`Atualizando ${id}...`);
        await client.query(`
            INSERT INTO public.ibs_perfis (id, nome_completo, cargo, aprovado, telefone)
            VALUES ($1, 'Thiago Mayan', 'ADMIN', true, '(71) 99207-2318')
            ON CONFLICT (id) DO UPDATE SET 
                nome_completo = 'Thiago Mayan',
                cargo = 'ADMIN',
                aprovado = true,
                telefone = '(71) 99207-2318';
        `, [id]);
    }

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Todos os possíveis IDs de Thiago agora são ADMIN com dados preenchidos.');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
