import fs from 'fs';
import path from 'path';

function checkJSXFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkJSXFiles(fullPath);
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('useState(') && !line.includes('useState([])') && !line.includes('useState(null)') && !line.includes('useState(\'\')') && !line.includes('useState(false)') && !line.includes('useState(true)') && !line.includes('useState(0)') && !line.includes('useState(1)')) {
          console.log(`${file}:${idx + 1}: ${line.trim()}`);
          // Print 3 lines before and 5 lines after
          for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 8); i++) {
            console.log(`  ${i+1}: ${lines[i]}`);
          }
        }
      });
    }
  });
}

checkJSXFiles('src');
