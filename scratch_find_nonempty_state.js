import fs from 'fs';
import path from 'path';

function searchNonEmptyUseState(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchNonEmptyUseState(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('useState(')) {
          const match = line.match(/useState\(\s*\[([^\]]+)\]\s*\)/);
          if (match) {
            console.log(`${file}:${idx + 1}: ${line.trim()}`);
          }
        }
      });
    }
  });
}

searchNonEmptyUseState('src');
