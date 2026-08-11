const fs = require('fs');

// 1. Fix style.css
let css = fs.readFileSync('assets/css/style.css', 'utf8');

css = css.replace(
`.sidebar-brand-container {
    overflow: hidden;
    transition: opacity 0.3s ease, width 0.3s ease;
    opacity: 1;
}`,
`.sidebar-brand-container {
    overflow: hidden;
    transition: opacity 0.3s ease, width 0.3s ease;
    opacity: 1;
    text-decoration: none;
    color: inherit;
}`
);

// Add display logic for logo-icon
const logoFix = `
#logo-icon {
    display: none;
}
.sidebar.collapsed #logo-icon {
    display: block;
}
`;
if (!css.includes('#logo-icon { display: none; }')) {
    css += logoFix;
}

fs.writeFileSync('assets/css/style.css', css, 'utf8');


// 2. Fix JS files
const filesToFix = ['assets/js/grammar.js', 'assets/js/pronunciation.js'];

filesToFix.forEach(file => {
    let js = fs.readFileSync(file, 'utf8');
    
    // Replace old toggle logic using a regex
    const oldLogicRegex = /const\s+sidebarToggle\s*=\s*document\.getElementById\('sidebar-toggle'\);\s*const\s+sidebar\s*=\s*document\.querySelector\('\.sidebar'\);\s*if\s*\(sidebarToggle\s*&&\s*sidebar\)\s*\{[\s\S]*?localStorage\.setItem\('sidebar-collapsed',\s*sidebar\.classList\.contains\('collapsed'\)\);\s*}\);?\s*\}/m;
    
    const newLogic = `const sidebarToggle = document.getElementById('sidebar-toggle-expanded');
    const expandIcon = document.getElementById('expand-icon');
    const sidebarBrandContainer = document.querySelector('.sidebar-brand-container');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebar) {
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.style.transition = 'none';
            sidebar.classList.add('collapsed');
            setTimeout(() => sidebar.style.transition = '', 50);
        }
        
        const toggleSidebar = (e) => {
            if (e) e.preventDefault();
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        };

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        
        if (sidebarBrandContainer && expandIcon) {
            sidebarBrandContainer.addEventListener('click', (e) => {
                if (sidebar.classList.contains('collapsed')) {
                    toggleSidebar(e);
                }
            });
        }
    }`;
    
    if (oldLogicRegex.test(js)) {
        js = js.replace(oldLogicRegex, newLogic);
        fs.writeFileSync(file, js, 'utf8');
        console.log('Fixed JS in', file);
    } else {
        console.log('Regex did not match in', file);
    }
});
