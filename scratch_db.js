import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env manually
const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.log(`Table: ${tableName} - Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`Table: ${tableName} - Columns:`, Object.keys(data[0]));
      console.log(`Table: ${tableName} - Sample Row:`, data[0]);
    } else {
      console.log(`Table: ${tableName} - Empty (or no data)`);
    }
  } catch (err) {
    console.error(`Error inspecting ${tableName}:`, err);
  }
}

async function main() {
  const tables = [
    'users',
    'groups',
    'teacher_subjects',
    'assignments',
    'assignment_groups',
    'submissions',
    'attendance',
    'timetable',
    'notifications'
  ];

  for (const t of tables) {
    await inspectTable(t);
  }
}

main();
