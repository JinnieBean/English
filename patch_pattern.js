const fs = require('fs');

// Patch admin/index.html
let html = fs.readFileSync('admin/index.html', 'utf8');
html = html.replace('<input type="text" id="pattern-pattern" required>', '<textarea id="pattern-pattern" rows="3" class="input-field" required></textarea>');
fs.writeFileSync('admin/index.html', html);
console.log('Patched admin/index.html');

// Patch assets/js/main.js
let js = fs.readFileSync('assets/js/main.js', 'utf8');
js = js.replace('<div style="font-size: 1.1rem; color: #4a7578;">${p.pattern}</div>', '<div style="font-size: 1.1rem; color: #4a7578;">${p.pattern ? p.pattern.replace(/\\n/g, \'<br>\') : \'\'}</div>');
fs.writeFileSync('assets/js/main.js', js);
console.log('Patched main.js');
