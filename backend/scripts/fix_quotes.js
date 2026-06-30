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

    // Fix mismatched quotes: from "... ";  -> from '... ';
    content = content.replace(/from '([^']+)';/g, "from '$1';");

    // also handle from "... "; just in case (though unlikely from my script)
    content = content.replace(/from "([^"]+)";/g, 'from "$1';');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Fixed: ${path.relative(rootDir, file)}`);
        changedCount++;
    }
});

console.log(`Total files fixed: ${changedCount}`);
