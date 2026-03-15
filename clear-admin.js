const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  try {
    await client.connect();
    // Deletar da auth.users e deixar o trigger/cascade limpar o resto
    const res = await client.query("DELETE FROM auth.users WHERE email = 'thiagomayan@gmail.com'");
    console.log('User deleted:', res.rowCount);
  } catch (err) {
    console.error('Error deleting user:', err);
  } finally {
    await client.end();
  }
}
run();
