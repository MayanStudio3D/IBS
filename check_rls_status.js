
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies_verbose');
  if (error) {
    // If rpc doesn't exist, try getting from pg_policies
    const { data: policies, error: pgError } = await supabase.rpc('execute_sql', {
      sql: "SELECT * FROM pg_policies WHERE tablename = 'ibs_pedido_itens';"
    });
    if (pgError) {
       console.log("Checking via raw SQL query on pg_policies...");
       const { data: raw, error: rawError } = await supabase.from('pg_policies').select('*').eq('tablename', 'ibs_pedido_itens');
       if (rawError) {
         // Last resort: let's try to list them using a known helper function if available or just execute a direct query via service role if we have an exec tool
         console.log("Could not fetch policies via RPC or direct select on pg_policies. Trying executing direct SQL...");
       } else {
         console.log(JSON.stringify(raw, null, 2));
       }
    } else {
      console.log(JSON.stringify(policies, null, 2));
    }
  } else {
    console.log(JSON.stringify(data.filter(p => p.tablename === 'ibs_pedido_itens'), null, 2));
  }
}

// Since I might not have 'get_policies_verbose', let's just use a direct query tool if I had one.
// But I can use the 'supabase' client to execute SQL if I have a custom function.
// Let's try to just use pg_policies directly.

async function run() {
  const { data, error } = await supabase.from('ibs_perfis').select('id, cargo').limit(1);
  console.log('Sample profile:', data);
  
  const { data: policies, error: polError } = await supabase.rpc('execute_sql', {
    sql: "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'ibs_pedido_itens';"
  });
  
  if (polError) {
    console.log('Error fetching policies:', polError);
    // Maybe try standard query
    const { data: ds, error: de } = await supabase.from('pg_policies').select('*').eq('tablename', 'ibs_pedido_itens');
    console.log('Policies from pg_policies table:', ds || de);
  } else {
    console.log('Policies for ibs_pedido_itens:', JSON.stringify(policies, null, 2));
  }
}

run();
