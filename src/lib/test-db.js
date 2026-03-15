
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('--- Buscando tabelas no schema public ---');
  const { data, error } = await supabase.rpc('get_tables_info'); // Tentando RPC comum se existir
  
  if (error) {
    // Se não houver RPC, tentamos uma abordagem alternativa via PostgREST
    // Notando que o Supabase local às vezes expõe tabelas do sistema se configurado
    const { data: test, error: testErr } = await supabase.from('profiles').select('count').limit(1);
    if (testErr) {
       console.log('Tabela "profiles" não encontrada ou erro:', testErr.message);
    } else {
       console.log('Tabela "profiles" existe.');
    }
    
    console.log('--- Verificação concluída ---');
  } else {
    console.log('Tabelas encontradas:', data);
  }
}

listTables();
