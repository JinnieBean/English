const fs = require('fs');

let css = fs.readFileSync('assets/css/style.css', 'utf8');

// 1. Update Sidebar Widths
css = css.replace(/flex: 0 0 230px;/g, 'flex: 0 0 220px;');
css = css.replace(/width: 230px;/g, 'width: 220px;');

css = css.replace(/\.sidebar\.collapsed \{\s*width: 60px;\s*flex: 0 0 60px;\s*\}/, '.sidebar.collapsed {\n    width: 72px;\n    flex: 0 0 72px;\n}');

// 2. Nav Link Active Color (Keep icon dark, blue border/bg)
css = css.replace(/\.nav-link\.active \{\s*background-color: #f0f7ff;\s*color: #0056b3;\s*font-weight: 600;\s*border-left-color: #0056b3;\s*\}/, 
`.nav-link.active {
    background-color: #ebf4ff;
    color: #1a202c;
    font-weight: 600;
    border-left-color: #0066ff;
}`);

// 3. Logo/Expand Hover Logic
// Replace the old collapsed header logic
const oldCollapsedLogic = `.sidebar.collapsed .sidebar-brand-container {
    display: none;
}
.sidebar.collapsed .sidebar-header {
    padding: 1rem 0;
    justify-content: center;
    flex-direction: row;
}
.sidebar.collapsed .sidebar-logo-small {
    display: flex;
}
.sidebar.collapsed .sidebar-toggle {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.sidebar.collapsed .sidebar-header:hover .sidebar-logo-small {
    opacity: 0;
}
.sidebar.collapsed .sidebar-header:hover .sidebar-toggle {
    display: flex;
}`;

const newCollapsedLogic = `.sidebar.collapsed .sidebar-brand-container {
    display: flex;
    justify-content: center;
    width: 100%;
    text-decoration: none;
}
.sidebar.collapsed .sidebar-header {
    padding: 1rem 0;
    justify-content: center;
    flex-direction: row;
}
.sidebar.collapsed .sidebar-logo-small {
    display: none; /* We don't use this anymore */
}
.sidebar.collapsed #sidebar-toggle-expanded {
    display: none;
}
.sidebar.collapsed .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.sidebar.collapsed .sidebar-brand-container:hover .logo-wrapper {
    background-color: #f1f5f9;
}
.sidebar.collapsed .sidebar-brand-container:hover #logo-icon {
    display: none;
}
.sidebar.collapsed .sidebar-brand-container:hover #expand-icon {
    display: flex !important;
    align-items: center;
    justify-content: center;
    color: #475569;
}`;

css = css.replace(oldCollapsedLogic, newCollapsedLogic);

// Add styling for logo-wrapper and new icons
const extraCss = `
.logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}
.sidebar-expand-icon svg {
    width: 20px;
    height: 20px;
}
#sidebar-toggle-expanded {
    background: transparent;
    border: none;
    border-radius: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    transition: background-color 0.2s;
    padding: 0;
}
#sidebar-toggle-expanded:hover {
    background-color: #f1f5f9;
}
`;
if (!css.includes('.logo-wrapper')) {
    css += extraCss;
}

fs.writeFileSync('assets/css/style.css', css, 'utf8');
console.log('CSS updated');
