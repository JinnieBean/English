import re

with open('d:/Data/Project/web/English/admin/js/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

dm_script = """
    // Dark mode logic
    const dmBtn = document.getElementById('admin-dark-mode-btn');
    if (dmBtn) {
        dmBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('admin-theme-dark', 'false');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('admin-theme-dark', 'true');
            }
        });
    }
"""

if "admin-theme-dark" not in code:
    code = re.sub(r'(document\.addEventListener\(\'DOMContentLoaded\', async \(\) => \{)', r'\1\n' + dm_script, code)
    with open('d:/Data/Project/web/English/admin/js/admin.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Dark mode JS injected")
else:
    print("Already injected")
