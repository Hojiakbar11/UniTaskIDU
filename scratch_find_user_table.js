import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- AdminDashboard.jsx table loops ---');
lines.forEach((line, idx) => {
  if (line.includes('filteredUsers') || line.includes('usersList') || line.includes('<table')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
