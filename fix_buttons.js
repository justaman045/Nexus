const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the specific "Future of SaaS" section button styling from the screenshot
    content = content.replace(/bg-zinc-950 text-white rounded-2xl text-\[11px\]/g, 'bg-background text-foreground rounded-2xl text-[11px]');
    content = content.replace(/border border-zinc-200 text-zinc-950 rounded-2xl text-\[11px\]/g, 'border border-foreground/10 text-foreground rounded-2xl text-[11px]');
    
    fs.writeFileSync(file, content);
});
console.log('Fixed button specific mappings.');
