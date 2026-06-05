import fs from 'fs';

function findMaps(path) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`=== ${path} ===`);
  lines.forEach((line, idx) => {
    if (line.includes('.map(')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}

findMaps('src/pages/StudentDashboard.jsx');
findMaps('src/pages/TeacherDashboard.jsx');
