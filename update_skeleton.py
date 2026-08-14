import sys

# grammar.js
with open('d:/Data/Project/web/English/assets/js/grammar.js', 'r', encoding='utf-8') as f:
    code = f.read()

skeleton = """    if (overviewContainer) {
        overviewContainer.innerHTML = Array(3).fill(`
            <div class="grammar-category" style="margin-bottom: 3rem;">
                <div class="skeleton skeleton-title"></div>
                <div style="margin-bottom: 1.5rem;">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `).join('');
        try {"""

import re
code = re.sub(r"if\s*\(overviewContainer\)\s*\{\s*try\s*\{", skeleton, code)
with open('d:/Data/Project/web/English/assets/js/grammar.js', 'w', encoding='utf-8') as f:
    f.write(code)

# pronunciation.js
with open('d:/Data/Project/web/English/assets/js/pronunciation.js', 'r', encoding='utf-8') as f:
    code2 = f.read()

skeleton2 = """    if (overviewContainer) {
        overviewContainer.innerHTML = Array(3).fill(`
            <div class="grammar-category" style="margin-bottom: 3rem;">
                <div class="skeleton skeleton-title"></div>
                <div style="margin-bottom: 1.5rem;">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `).join('');
        try {"""

code2 = re.sub(r"if\s*\(overviewContainer\)\s*\{\s*try\s*\{", skeleton2, code2)
with open('d:/Data/Project/web/English/assets/js/pronunciation.js', 'w', encoding='utf-8') as f:
    f.write(code2)

print("Updated grammar and pronunciation with skeleton loading")
