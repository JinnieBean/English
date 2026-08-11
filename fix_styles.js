const fs = require('fs');

let css = fs.readFileSync('assets/css/style.css', 'utf8');

// 1. Fix Note Image Distortion
css = css.replace(
`.note-image {
    width: 220px;
    height: 260px;`,
`.note-image {
    width: 260px;
    height: 260px;`
);

// 2. Fix Thor's Notes text wrapping and stuttering
// Find .sidebar-brand-container and update it to have flex, gap, and nowrap
css = css.replace(
`.sidebar-brand-container {
    overflow: hidden;
    transition: opacity 0.3s ease, width 0.3s ease;
    opacity: 1;
    text-decoration: none;
    color: inherit;
}`,
`.sidebar-brand-container {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity 0.3s ease, width 0.3s ease;
    opacity: 1;
    text-decoration: none;
    color: inherit;
}`
);

// Add styling for .sidebar-brand-text if not exists
if (!css.includes('.sidebar-brand-text {')) {
    const textStyle = `
.sidebar-brand-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0056b3;
    white-space: nowrap;
}
`;
    css += textStyle;
}

fs.writeFileSync('assets/css/style.css', css, 'utf8');
console.log('Styles fixed');
