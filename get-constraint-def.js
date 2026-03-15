const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- BUSCANDO DEFINIÇÃO DA CONSTRAINT ibs_perfis_cargo_check ---');
    
    const res = await client.query(`
        SELECT pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conname = 'ibs_perfis_cargo_check'
    `);

    if (res.rows.length > 0) {
        console.log('Definição:', res.rows[0].pg_get_constraintdef);
    } else {
        console.log('Constraint não encontrada. Verificando todas as constraints da tabela...');
        const allRes = await client.query(`
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'public.ibs_perfis'::regclass
        `);
        console.log('Todas as constraints:', allRes.rows);
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
