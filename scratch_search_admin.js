import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- AdminDashboard.jsx search ---');
lines.forEach((line, idx) => {
  if (line.includes('Global Jurnal') || line.includes('gradebook') || line.includes('submission') || line.includes('onChange')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
