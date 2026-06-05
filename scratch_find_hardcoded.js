import fs from 'fs';

function findHardcodedTitles(path) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`=== ${path} ===`);
  lines.forEach((line, idx) => {
    if (line.includes('title:') && (line.includes("'") || line.includes('"'))) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}

findHardcodedTitles('src/pages/StudentDashboard.jsx');
findHardcodedTitles('src/pages/TeacherDashboard.jsx');
