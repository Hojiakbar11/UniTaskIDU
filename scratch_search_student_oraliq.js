import fs from 'fs';

const content = fs.readFileSync('src/pages/StudentDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- StudentDashboard.jsx "1-Oraliq" references ---');
lines.forEach((line, idx) => {
  if (line.includes('1-Oraliq')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
