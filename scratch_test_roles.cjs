const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const candidateRoles = [
  'Admin',
  'ADMIN',
  'superuser',
  'superadmin',
  'manager',
  'staff',
  'director',
  'operator',
  'rector',
  'dekan',
  'uslubchi'
];

async function main() {
  for (const role of candidateRoles) {
    console.log(`Trying role: "${role}"...`);
    const { data, error } = await supabase
      .from('users')
      .insert({
        full_name: `Test ${role}`,
        role: role,
        login: `test_${role.toLowerCase()}`,
        password: '111'
      })
      .select();

    if (error) {
      console.log(`Failed for "${role}":`, error.message);
    } else {
      console.log(`SUCCESS for "${role}"! Data:`, data);
      // Clean it up immediately
      await supabase.from('users').delete().eq('id', data[0].id);
      return;
    }
  }
  console.log("None of the candidate roles succeeded.");
}
main();
