const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE public.ibs_perfis ADD COLUMN IF NOT EXISTS avatar_url text;
    `);
    console.log('Success avatar');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
