import fs from 'fs';

function searchFile(path) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`--- ${path} ---`);
  lines.forEach((line, idx) => {
    if (line.includes('Yakuniy') || line.includes('Amaliyot') || line.includes('Oraliq') || line.includes('dummy')) {
      if (line.includes('title:') || line.includes('const') || line.includes('useState') || line.includes('[') || line.includes('data')) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
}

searchFile('src/pages/StudentDashboard.jsx');
searchFile('src/pages/TeacherDashboard.jsx');
