import fs from 'fs';

function findSetAssignments(path) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`=== ${path} ===`);
  lines.forEach((line, idx) => {
    if (line.includes('setAssignments')) {
      console.log(`${idx + 1}: ${line.trim()}`);
      // Show surrounding lines
      for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 10); i++) {
        console.log(`  ${i+1}: ${lines[i]}`);
      }
    }
  });
}

findSetAssignments('src/pages/StudentDashboard.jsx');
findSetAssignments('src/pages/TeacherDashboard.jsx');
