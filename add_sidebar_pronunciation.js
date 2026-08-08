const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const linkToAdd = `
                    <a href="pronunciation.html" class="nav-link" title="Pronunciation">
                        <span class="icon">🗣️</span> <span class="nav-link-text">Pronunciation</span>
                    </a>`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Find the end of the Grammar link block
    // It looks like:
    // <a href="grammar.html" class="nav-link" title="Grammar">
    //     <span class="icon">⭕</span> <span class="nav-link-text">Grammar</span>
    // </a>
    // Or class="nav-link active"
    
    const regex = /(<a href="grammar\.html" class="nav-link(?: active)?" title="Grammar">\s*<span class="icon">⭕<\/span> <span class="nav-link-text">Grammar<\/span>\s*<\/a>)/g;
    
    if (regex.test(content)) {
        // If it's pronunciation.html or pronunciation_lesson.html, we should also make the pronunciation link active,
        // but for simplicity, we can just insert it first, then for pronunciation files we manually fix the active class.
        
        let newContent = content.replace(regex, `$1${linkToAdd}`);
        
        if (f === 'pronunciation.html' || f === 'pronunciation_lesson.html') {
            newContent = newContent.replace(/class="nav-link active" title="Grammar"/g, 'class="nav-link" title="Grammar"');
            newContent = newContent.replace(/class="nav-link" title="Pronunciation"/g, 'class="nav-link active" title="Pronunciation"');
        }
        
        fs.writeFileSync(f, newContent);
        console.log('Updated sidebar in', f);
    }
});
