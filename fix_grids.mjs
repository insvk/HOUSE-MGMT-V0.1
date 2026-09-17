import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Replace grid-cols-2 with grid-cols-1 sm:grid-cols-2 (only if it starts with grid grid-cols-2)
  content = content.replace(/className="grid grid-cols-2 /g, 'className="grid grid-cols-1 sm:grid-cols-2 ');
  content = content.replace(/className="grid grid-cols-2"/g, 'className="grid grid-cols-1 sm:grid-cols-2"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  replaceInFile(path.join(dir, file));
}
console.log('Fixed rigid grid-cols-2 classes.');
