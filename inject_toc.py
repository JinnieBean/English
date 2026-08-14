import re

def inject_toc(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Function to build TOC
    toc_func = """
    function buildTOC() {
        const contentArea = document.querySelector('.lesson-content');
        const tocList = document.getElementById('toc-list');
        const tocContainer = document.getElementById('toc-container');
        
        if (!contentArea || !tocList || !tocContainer) return;
        
        const headings = contentArea.querySelectorAll('h2, h3');
        if (headings.length === 0) {
            tocContainer.parentElement.style.display = 'none';
            return;
        }
        
        let tocHtml = '';
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = 'heading-' + index;
            }
            const level = heading.tagName.toLowerCase() === 'h3' ? 'toc-h3' : 'toc-h2';
            tocHtml += `<li class="${level}"><a href="#${heading.id}" data-id="${heading.id}">${heading.innerText}</a></li>`;
        });
        
        tocList.innerHTML = tocHtml;
        
        // Active scroll spy
        const links = tocList.querySelectorAll('a');
        window.addEventListener('scroll', () => {
            let currentId = '';
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    currentId = heading.id;
                }
            });
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-id') === currentId) {
                    link.classList.add('active');
                }
            });
        });
    }
"""

    if "function buildTOC" not in code:
        code += toc_func

    # Insert buildTOC() call after updating HTML
    # We look for: lessonContainer.innerHTML = `...`;
    code = re.sub(r'(lessonContainer\.innerHTML\s*=\s*`[^`]*`;)', r'\1\n                if (typeof buildTOC === "function") buildTOC();', code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

inject_toc('d:/Data/Project/web/English/assets/js/grammar.js')
inject_toc('d:/Data/Project/web/English/assets/js/pronunciation.js')
print("TOC injected")
