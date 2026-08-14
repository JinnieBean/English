import re

html_files = [
    'd:/Data/Project/web/English/grammar_lesson.html',
    'd:/Data/Project/web/English/pronunciation_lesson.html'
]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change main container class
    content = content.replace('<main class="container">', '<main class="container lesson-layout">')
    
    # Add TOC area
    if 'id="grammar-lesson-container"' in content:
        content = content.replace('<div id="grammar-lesson-container">', '<div id="grammar-lesson-container" class="lesson-content-area">')
    if 'id="pronunciation-lesson-container"' in content:
        content = content.replace('<div id="pronunciation-lesson-container">', '<div id="pronunciation-lesson-container" class="lesson-content-area">')

    toc_html = """
    <div class="lesson-toc-area">
         <div class="toc-sticky" id="toc-container">
             <h4>Table of Contents</h4>
             <ul class="toc-list" id="toc-list"></ul>
         </div>
    </div>
"""
    # Insert before </main>
    content = re.sub(r'(</main>)', toc_html + r'\1', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("HTML structures updated for TOC.")
