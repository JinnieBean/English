const fs = require('fs');
const path = require('path');

const directoryPath = './';

const homeSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const gridSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
const circleSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"></circle></svg>`;
const starSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

const newHeader = `            <div class="sidebar-header">
                <a href="index.html" class="sidebar-brand-container">
                    <div class="logo-wrapper">
                        <span class="sidebar-brand-icon" id="logo-icon">❄️</span>
                        <span class="sidebar-expand-icon" id="expand-icon" style="display:none;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="15" y1="3" x2="15" y2="21"></line>
                                <polyline points="8 9 11 12 8 15"></polyline>
                            </svg>
                        </span>
                    </div>
                    <span class="sidebar-brand-text">Thor's Notes</span>
                </a>
                <button class="sidebar-toggle" id="sidebar-toggle-expanded">
                    <svg class="icon-collapse" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <polyline points="15 15 12 12 15 9"></polyline>
                    </svg>
                </button>
            </div>`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Replace header
    content = content.replace(/<div class="sidebar-header">[\s\S]*?<\/div>\s*<nav class="sidebar-nav">/, newHeader + '\n            <nav class="sidebar-nav">');

    // 2. Replace emojis with SVGs
    content = content.replace(/<span class="icon">🏠<\/span>/g, `<span class="icon">${homeSvg}</span>`);
    content = content.replace(/<span class="icon">🔠<\/span>/g, `<span class="icon">${gridSvg}</span>`);
    content = content.replace(/<span class="icon">⭕<\/span>/g, `<span class="icon">${circleSvg}</span>`);
    content = content.replace(/<span class="icon">🗣️<\/span>/g, `<span class="icon">${starSvg}</span>`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
}

fs.readdirSync(directoryPath).forEach(file => {
    if (file.endsWith('.html') && !file.startsWith('admin')) {
        processFile(path.join(directoryPath, file));
    }
});
