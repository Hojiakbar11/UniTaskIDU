import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- AdminDashboard.jsx filteredUsers references ---');
lines.forEach((line, idx) => {
  if (line.includes('filteredUsers')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
