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
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace hardcoded zinc and white with semantic variables where appropriate
    content = content.replace(/\bbg-zinc-950\b/g, 'bg-background');
    content = content.replace(/\bbg-zinc-900\b/g, 'bg-secondary');
    content = content.replace(/\bbg-zinc-800\b/g, 'bg-muted');
    
    content = content.replace(/\btext-white\b/g, 'text-foreground');
    content = content.replace(/\btext-zinc-950\b/g, 'text-background');
    
    content = content.replace(/\btext-zinc-500\b/g, 'text-muted-foreground');
    content = content.replace(/\btext-zinc-600\b/g, 'text-secondary-foreground');
    content = content.replace(/\btext-zinc-400\b/g, 'text-muted-foreground');
    
    content = content.replace(/\bbg-white\b/g, 'bg-foreground');
    content = content.replace(/\bbg-black\b/g, 'bg-background');
    
    content = content.replace(/bg-white\//g, 'bg-foreground/');
    content = content.replace(/border-white\//g, 'border-foreground/');
    content = content.replace(/text-white\//g, 'text-foreground/');
    content = content.replace(/shadow-white\//g, 'shadow-foreground/');
    
    content = content.replace(/border-zinc-\d+/g, 'border-border');

    fs.writeFileSync(file, content);
});
console.log('Refactored classes.');
