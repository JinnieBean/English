with open('d:/Data/Project/web/English/admin/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

btn = '''<button id="admin-dark-mode-btn" class="btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <i class="fas fa-moon" id="admin-dm-icon"></i><span class="nav-text">Dark Mode</span>
                  </button>'''

html = html.replace('<div class="sidebar-footer">', '<div class="sidebar-footer">\n                  ' + btn)

init_script = '''<script>
        if (localStorage.getItem('admin-theme-dark') === 'true') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    </script>'''
html = html.replace('<link rel="stylesheet" href="css/admin.css">', init_script + '\n    <link rel="stylesheet" href="css/admin.css">')

with open('d:/Data/Project/web/English/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Dark mode toggle added to admin index')
