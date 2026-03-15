const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:55321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const emailToDelete = 'thiagomayan@gmail.com';
  console.log(`Buscando usuário: ${emailToDelete}...`);

  try {
    // 1. Buscar o usuário pelo email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    const user = users.find(u => u.email === emailToDelete);

    if (!user) {
      console.log('Usuário não encontrado no Auth.');
    } else {
      console.log(`Usuário encontrado: ${user.id}. Deletando...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
      console.log('Usuário deletado do Auth com sucesso.');
    }

    // 2. Limpar perfil por garantia (caso o cascade falhe)
    console.log('Limpando perfil na tabela ibs_perfis...');
    const { error: profileError } = await supabase
      .from('ibs_perfis')
      .delete()
      .eq('email', emailToDelete); // Note: ibs_perfis usually has email or we join.
    
    // Se a tabela usar ID (UUID), o delete do auth geralmente limpa se houver FK cascade.
    // Mas vamos tentar deletar por email se a coluna existir.
    
    console.log('Processo concluído.');
  } catch (err) {
    console.error('Erro durante a execução:', err.message);
  }
}

run();
