import fs from 'fs';
import path from 'path';

function findJSXAndJSFiles(dir) {
  const list = [];
  function recurse(d) {
    const files = fs.readdirSync(d);
    files.forEach(f => {
      const fp = path.join(d, f);
      if (fs.statSync(fp).isDirectory()) {
        recurse(fp);
      } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
        list.push(fp);
      }
    });
  }
  recurse(dir);
  return list;
}

const files = findJSXAndJSFiles('src');
console.log('Files:', files);
