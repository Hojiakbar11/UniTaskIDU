import fs from 'fs';

const content = fs.readFileSync('src/pages/TeacherDashboard.jsx', 'utf-8');
const lines = content.split('\n');

console.log('--- TeacherDashboard.jsx "Yakuniy" references ---');
lines.forEach((line, idx) => {
  if (line.includes('Yakuniy') || line.includes('Yakuniy topshiriq')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
