const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetDirs = ['app', 'frontend', 'backend'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (extensions.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

let files = [];
targetDirs.forEach(d => {
    files = files.concat(walk(path.join(rootDir, d)));
});

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix imports to point to new Root aliases
    // e.g. from '@/frontend/...' -> remains same because alias changed
    // e.g. from '@/src/frontend/...' -> '@/frontend/...'

    // 1. Remove 'src' from specific aliases if present
    content = content.replace(/@\/src\/frontend/g, '@/frontend');
    content = content.replace(/@\/src\/backend/g, '@/backend');
    content = content.replace(/@\/src\/app/g, '@/app'); // less common

    // 2. Ensure general src/ removal
    content = content.replace(/@\/src\//g, '@/');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${path.relative(rootDir, file)}`);
        changedCount++;
    }
});

console.log(`Total files updated: ${changedCount}`);
