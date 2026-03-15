const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- EXAMINANDO CONSTRAINTS DA TABELA ibs_perfis ---');
    
    const res = await client.query(`
        SELECT 
            conname, 
            pg_get_constraintdef(c.oid) as definition
        FROM 
            pg_constraint c
        JOIN 
            pg_class t ON t.oid = c.conrelid
        WHERE 
            t.relname = 'ibs_perfis';
    `);

    console.log('Constraints encontradas:', res.rows);

    // Também listar os enum types se houver
    const enums = await client.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
    `);
    console.log('Enums no banco:', enums.rows);

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}
run();
