import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (error) {
    // pg_tables pode não estar acessível diretamente via PostgREST em alguns casos
    // Vamos tentar uma query SQL direta via RPC se disponível, ou apenas listar o que conseguirmos
    console.log('Tentando listar tabelas via query SQL...');
    const { data: tables, error: sqlError } = await supabase.rpc('get_tables_info');
    if (sqlError) {
      console.error('Erro ao listar tabelas:', sqlError);
    } else {
      console.log('Tabelas encontradas:', tables);
    }
  } else {
    console.log('Tabelas na schema public:', data.map(t => t.tablename));
  }
}

checkTables();
