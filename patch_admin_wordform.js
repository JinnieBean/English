const fs = require('fs');
let code = fs.readFileSync('admin/js/admin.js', 'utf8');

const regexSplit = `
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
`;

const oldUI = `<div class="input-group">
            <label>Title (e.g. act v ≠ overact v)</label>
            <input type="text" class="input-field wf-title" value="\${title.replace(/"/g, '&quot;')}" required>
        </div>`;

const newUI = `${regexSplit}
        <div class="form-row">
            <div class="input-group flex-1">
                <label>Word</label>
                <input type="text" class="input-field wf-word" value="\${wordVal.replace(/"/g, '&quot;')}" required>
            </div>
            <div class="input-group" style="width: 200px;">
                <label>Part of Speech (POS)</label>
                <input type="text" class="input-field wf-pos" value="\${posVal.replace(/"/g, '&quot;')}">
            </div>
        </div>`;

if (code.includes(oldUI)) {
    code = code.replace(oldUI, newUI);
    console.log("Replaced UI.");
} else {
    console.log("Could not find old UI chunk!");
}

const oldSave = `const title = r.querySelector('.wf-title').value.trim();`;
const newSave = `const word = r.querySelector('.wf-word').value.trim();
        const pos = r.querySelector('.wf-pos').value.trim();
        const title = pos ? (word + ' ' + pos) : word;`;

if (code.includes(oldSave)) {
    code = code.replace(oldSave, newSave);
    console.log("Replaced save logic.");
} else {
    console.log("Could not find old save chunk!");
}

fs.writeFileSync('admin/js/admin.js', code);
