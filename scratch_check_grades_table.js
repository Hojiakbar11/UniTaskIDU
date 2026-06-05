import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testTable(name) {
  const { data, error } = await supabase.from(name).select('*').limit(1);
  if (error) {
    console.log(`Table ${name} exists but error:`, error.message);
  } else {
    console.log(`Table ${name} exists! Data:`, data);
  }
}

async function main() {
  const possibleTables = ['grades', 'scores', 'student_grades', 'exam_grades', 'exams', 'marks'];
  for (const name of possibleTables) {
    await testTable(name);
  }
}

main();
