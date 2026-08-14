import re
import sys

file_path = "d:/Data/Project/web/English/admin/js/admin.js"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update closeBtns logic
old_close = """const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).style.display = 'none'; window.closeTinyMCEPopups();
    });
});"""
new_close = """window.isModalDirty = false;
document.addEventListener('input', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});
document.addEventListener('change', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});

const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (window.isModalDirty) {
            if (!confirm("You have unsaved changes. Are you sure you want to close?")) return;
        }
        const targetId = e.target.getAttribute('data-target');
        const modal = document.getElementById(targetId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        window.closeTinyMCEPopups();
        window.isModalDirty = false;
    });
});"""

code = code.replace(old_close, new_close)

# 2. Add class on open
code = re.sub(
    r"(\w+Modal)\.style\.display\s*=\s*'flex';",
    r"\1.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;",
    code
)

# 3. Remove class on programmatic close (save success)
code = re.sub(
    r"(\w+Modal)\.style\.display\s*=\s*'none';\s*window\.closeTinyMCEPopups\(\);",
    r"\1.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;",
    code
)

# 4. TinyMCE setup hook
tiny_setup = """        content_style: "@font-face { font-family: 'Zeequada'; src: url('../assets/fonts/Zeequada-Regular.otf'); } @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&display=swap'); body { font-family: 'Urbanist', sans-serif; font-size: 1.15rem; line-height: 1.6; } h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; }",
        setup: function (editor) {
            editor.on('change keyup', function () {
                window.isModalDirty = true;
            });
        }
    });"""
code = re.sub(r"content_style:[^,]*\n\s*\}\);", tiny_setup, code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated admin.js with dirty form checks and body scroll fix")
