const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- VERIFICAÇÃO FINAL DOS DADOS DO THIAGO ---');
    
    const res = await client.query("SELECT id, nome_completo, cargo, aprovado FROM public.ibs_perfis WHERE id = '9a6eecb1-78ab-492b-bff3-6dcd45eb53bb'");
    console.log('Dados em ibs_perfis:', res.rows);

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
