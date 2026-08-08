
import fs from 'fs';
import path from 'path';

const directory = 'c:/Users/HP/Music/inventory-management-system/Frontend/src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(directory);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('<Search') || content.includes('{Search}')) {
        if (!content.includes('import {') || !content.includes('Search') || !content.includes('lucide-react')) {
             console.log(`Potential issue in ${file}: Search used but maybe not imported from lucide-react correctly.`);
        } else {
            // Check if Search is actually in the lucide-react import block
            const lucideImport = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
            if (lucideImport && !lucideImport[1].includes('Search')) {
                console.log(`ISSUE FOUND in ${file}: Search used in JSX but not in lucide-react import list.`);
            }
        }
    }
});
