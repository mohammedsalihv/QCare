const fs = require('fs');
const text = fs.readFileSync('tmp/waiting-guidance.txt','utf8');
const pages = Object.fromEntries([...text.matchAll(/\nPAGE (\d+)\n([\s\S]*?)(?=\nPAGE \d+\n|$)/g)].map(m => [m[1],m[2]]));
const reference = {};
for (let i=7;i<=24;i++) reference[i] = pages[i];
fs.mkdirSync('server/data',{recursive:true});
fs.writeFileSync('server/data/waitingTimeGuidance.json',JSON.stringify(reference,null,2)+'\n');
