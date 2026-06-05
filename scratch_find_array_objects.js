import fs from 'fs';

function findArrayOfObjects(path) {
  const content = fs.readFileSync(path, 'utf-8');
  const regex = /\[\s*\{\s*[^}]+\s*\}\s*\]/g;
  let match;
  console.log(`=== Matches in ${path} ===`);
  while ((match = regex.exec(content)) !== null) {
    console.log(`Match at index ${match.index}:`, match[0]);
  }
}

findArrayOfObjects('src/pages/StudentDashboard.jsx');
findArrayOfObjects('src/pages/TeacherDashboard.jsx');
