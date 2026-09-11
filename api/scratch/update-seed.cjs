const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/seed/seed.service.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const replacements = [
  ['Marcus Vance', 'Worker 1'],
  ['Sarah Jenkins', 'Worker 2'],
  ['David Kim', 'Worker 3'],
  ['Elena Rostova', 'Worker 4'],
  ['Tom Briggs', 'Worker 5'],
  ['Priya Patel', 'Worker 6'],
  ['Jack Gallagher', 'Worker 7'],
  ['Aisha Al-Mansoor', 'Worker 8'],
  ['Carlos Mendez', 'Worker 9'],
  ['Chloe Zhao', 'Worker 10'],
  ["Liam O\\'Connor", 'Worker 11'],
  ['Fatima Nour', 'Worker 12'],
  ['Gas Detector', 'Detector'],
  ['Arc Welder', 'Welder'],
  ['Multimeter', 'Meter'],
  ['Core Drill', 'Drill'],
  ['Laser Level', 'Level'],
];

for (const [from, to] of replacements) {
  content = content.replace(new RegExp(from, 'g'), to);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done');
