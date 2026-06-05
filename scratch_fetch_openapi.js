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

const url = `${env.VITE_SUPABASE_URL}/rest/v1/?apikey=${env.VITE_SUPABASE_ANON_KEY}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('supabase_openapi.json', JSON.stringify(data, null, 2));
    console.log('Tables exposed:');
    if (data.paths) {
      Object.keys(data.paths).forEach(p => {
        if (p !== '/' && !p.includes('{')) {
          console.log(`- ${p.substring(1)}`);
        }
      });
    }
    // Also log definitions/schemas if they exist
    if (data.definitions) {
      console.log('\nDefinitions:');
      Object.keys(data.definitions).forEach(def => {
        console.log(`- ${def}:`, Object.keys(data.definitions[def].properties));
      });
    }
  })
  .catch(err => console.error(err));
