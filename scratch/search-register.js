import fs from 'fs';
import path from 'path';

function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo' && file !== 'dist') {
        searchInDir(fullPath);
      }
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/API\.post\([^)]+\)/g);
      if (matches) {
        console.log(`File: ${fullPath}`);
        matches.forEach(m => console.log(`  ${m}`));
      }
    }
  }
}

console.log("Searching API.post in WorksitePro...");
searchInDir('c:/Users/Lenovo/Desktop/Real-Time Collaboration Platform/WorksitePro/src');

console.log("\nSearching API.post in frontend...");
searchInDir('c:/Users/Lenovo/Desktop/Real-Time Collaboration Platform/frontend/src');
