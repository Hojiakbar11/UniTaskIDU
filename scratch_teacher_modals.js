import fs from 'fs';

const content = fs.readFileSync('src/pages/TeacherDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- TeacherDashboard.jsx modal states ---');
lines.forEach((line, idx) => {
  if (line.includes('useState(false)') && line.includes('Open')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
