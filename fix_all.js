const fs = require('fs');
const path = require('path');

// ============================================================
// 1. Update style.css: Fix logo/expand icon hover logic
// ============================================================
let css = fs.readFileSync('assets/css/style.css', 'utf8');

// Fix .sidebar-brand-icon - always display none (shown via collapsed selector)
css = css.replace(
`.sidebar-brand-icon {
    font-size: 1.8rem;
    display: none;  /* hidden when expanded */
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.sidebar.collapsed .sidebar-brand-icon {
    display: flex; /* show only when collapsed */
}`,
`.sidebar-brand-icon {
    font-size: 2rem;
    display: none;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
}

/* Show snowflake icon only when collapsed (not hovering) */
.sidebar.collapsed .sidebar-brand-icon {
    display: flex;
}

/* .logo-wrapper and expand-icon hover logic */
.logo-wrapper {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* expand icon: hidden by default */
.sidebar-expand-icon {
    display: none;
    align-items: center;
    justify-content: center;
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: #f1f5f9;
    color: #475569;
    transition: background-color 0.2s;
}

.sidebar-expand-icon:hover {
    background: #e2e8f0;
}

.sidebar-expand-icon svg {
    width: 18px;
    height: 18px;
}

/* On hover of the whole brand container when collapsed: hide snowflake, show expand icon */
.sidebar.collapsed .sidebar-brand-container:hover .sidebar-brand-icon {
    display: none;
}

.sidebar.collapsed .sidebar-brand-container:hover .sidebar-expand-icon {
    display: flex;
}`
);

// Also increase note-image size for homepage
css = css.replace(
`.note-image {
    width: 240px;
    height: 240px;`,
`.note-image {
    width: 280px;
    height: 280px;`
);

// Increase note-card width
css = css.replace(
`    width: 280px;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.note-card:hover {`,
`    width: 320px;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.note-card:hover {`
);

fs.writeFileSync('assets/css/style.css', css, 'utf8');
console.log('CSS updated');

// ============================================================
// 2. Add inline collapse script to <head> of all frontend HTML files
//    This prevents the sidebar-expand flicker on page load
// ============================================================
const COLLAPSE_SCRIPT = `    <script>
        // Prevent sidebar flash: apply collapsed class immediately if stored
        (function() {
            if (localStorage.getItem('sidebar-collapsed') === 'true') {
                document.documentElement.classList.add('sidebar-will-collapse');
            }
        })();
    </script>`;

const files = fs.readdirSync('./').filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('sidebar-will-collapse')) {
        // Insert right before </head>
        html = html.replace('</head>', COLLAPSE_SCRIPT + '\n</head>');
        fs.writeFileSync(file, html, 'utf8');
        count++;
        console.log('Updated', file);
    }
});

console.log(`Updated ${count} HTML files`);
