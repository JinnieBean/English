import re

with open('d:/Data/Project/web/English/assets/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the media query block. We'll use regex to target the sidebar mobile CSS.
# First, remove .mobile-menu-btn and .sidebar block inside max-width: 768px.
mobile_css = """    .sidebar {
        position: fixed;
        left: 0;
        bottom: 0;
        top: auto;
        width: 100%;
        height: auto;
        flex-direction: row;
        border-right: none;
        border-top: 1px solid var(--sidebar-border);
        z-index: 1000;
        padding: 0.5rem;
        justify-content: center;
        align-items: center;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    }
    .app-layout { flex-direction: column; }
    .main-content { padding-bottom: 70px; }
    .sidebar-header { display: none; }
    .sidebar-nav {
        flex-direction: row;
        width: 100%;
        justify-content: space-around;
        gap: 0;
    }
    .nav-section-title { display: none; }
    .nav-section { display: flex; width: 100%; justify-content: space-around; flex-direction: row; margin: 0; }
    .nav-link {
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0.3rem;
        gap: 0.2rem;
        margin: 0;
    }
    .nav-link-text {
        font-size: 0.7rem;
        display: block;
        opacity: 1;
        width: auto;
    }
    .sidebar.collapsed .nav-link-text, .sidebar.collapsed .dm-label {
        display: block;
        opacity: 1;
        width: auto;
    }
    .dark-mode-toggle {
        margin: 0;
        padding: 0.3rem;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
    }
    .dm-label { font-size: 0.7rem; display: block; opacity: 1; width: auto; }
    .mobile-menu-btn { display: none !important; }"""

# We'll just replace the old block with the new one.
old_pattern = re.compile(r'\.mobile-menu-btn\s*\{[^}]+\}\s*\.sidebar\s*\{[^}]+\}\s*\.sidebar\.mobile-open\s*\{[^}]+\}')
css = old_pattern.sub(mobile_css, css)

with open('d:/Data/Project/web/English/assets/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Mobile bottom nav CSS injected")
