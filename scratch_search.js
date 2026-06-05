import fs from 'fs';

const content = fs.readFileSync('./src/pages/TeacherDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('.from(')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
