import fs from 'fs';
const data = JSON.parse(fs.readFileSync('supabase_openapi.json', 'utf8'));
console.log('Keys of schema:', Object.keys(data));
if (data.paths) {
  console.log('Paths:', Object.keys(data.paths));
}
if (data.definitions) {
  console.log('Definitions keys:', Object.keys(data.definitions));
}
