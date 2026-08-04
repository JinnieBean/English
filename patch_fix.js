const fs = require('fs');
let code = fs.readFileSync('admin/js/admin.js', 'utf8');

const badCode = `    row.innerHTML = \`
        <button type="button" class="btn-secondary btn-danger btn-small" style="position:absolute; top: 1rem; right: 1rem;" onclick="this.parentElement.remove()">Remove Form</button>
        
    let wordVal = title;
    let posVal = '';
    if (title) {
        const parts = title.trim().split(' ');
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (['v', 'n', 'adj', 'adv', 'prep', 'conj', 'pron', 'det'].includes(lastPart.toLowerCase())) {
                posVal = lastPart;
                wordVal = parts.slice(0, -1).join(' ');
            }
        }
    }

        <div class="form-row">`;

const goodCode = `
    let wordVal = title;
    let posVal = '';
    if (title) {
        const parts = title.trim().split(' ');
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (['v', 'n', 'adj', 'adv', 'prep', 'conj', 'pron', 'det'].includes(lastPart.toLowerCase())) {
                posVal = lastPart;
                wordVal = parts.slice(0, -1).join(' ');
            }
        }
    }

    row.innerHTML = \`
        <button type="button" class="btn-secondary btn-danger btn-small" style="position:absolute; top: 1rem; right: 1rem;" onclick="this.parentElement.remove()">Remove Form</button>
        <div class="form-row">`;

if (code.includes(badCode)) {
    code = code.replace(badCode, goodCode);
    fs.writeFileSync('admin/js/admin.js', code);
    console.log('Fixed syntax error in admin.js');
} else {
    console.log('Could not find badCode chunk in admin.js');
}
