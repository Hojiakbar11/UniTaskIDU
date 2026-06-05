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

async function main() {
  const { data: assignments, error: assError } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      lesson_type_id,
      subject_id,
      teacher_id
    `);

  if (assError) {
    console.error('Error fetching assignments:', assError);
    return;
  }

  console.log('Assignments in database:');
  assignments.forEach(a => {
    console.log(`- ID: ${a.id}, Title: "${a.title}", Lesson Type ID: ${a.lesson_type_id}`);
  });

  const { data: lessonTypes, error: ltError } = await supabase
    .from('lesson_types')
    .select('*');

  if (ltError) {
    console.error('Error fetching lesson types:', ltError);
    return;
  }

  console.log('\nLesson Types in database:');
  lessonTypes.forEach(lt => {
    console.log(`- ID: ${lt.id}, Name: "${lt.name}"`);
  });
}

main();
