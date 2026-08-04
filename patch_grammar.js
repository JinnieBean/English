const fs = require('fs');
let content = fs.readFileSync('english.html', 'utf8');
content = content.replace(
    /<div class="topic-card">\s*<div class="topic-image-container">\s*<img src="assets\/images\/grammar\.png" alt="Grammar">\s*<\/div>\s*<h2 class="topic-title mt-4">Grammar<\/h2>\s*<\/div>/g,
    `<a href="grammar.html" class="topic-card" style="text-decoration: none;">
                <div class="topic-image-container">
                    <img src="assets/images/grammar.png" alt="Grammar">
                </div>
                <h2 class="topic-title mt-4">Grammar</h2>
            </a>`
);
fs.writeFileSync('english.html', content);
