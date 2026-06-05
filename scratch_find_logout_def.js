import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- AdminDashboard.jsx logout references ---');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('logout') || line.includes('chiqish')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
