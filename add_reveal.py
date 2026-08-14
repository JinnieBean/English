filepath = 'd:/Data/Project/web/English/assets/js/main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add "reveal" class to item containers
js = js.replace('<div class="phrasal-item">', '<div class="phrasal-item reveal">')
js = js.replace('<div class="wf-item">', '<div class="wf-item reveal">')
# For lexical expansion, it uses vocab-item inside lexicalListContainer.
js = js.replace('                                <div class="vocab-item">', '                                <div class="vocab-item reveal">')

# 2. Add initRevealAnimations() inside render functions

render_funcs = [
    ("            const renderPhrasalList = (filteredList) => {", "            };"),
    ("            const renderPrepList = (filteredList) => {", "            };"),
    ("            const renderWfList = (filteredList) => {", "            };"),
    ("            const renderPatternList = (filteredList) => {", "            };"),
    ("            const renderLexicalList = (filteredList) => {", "            };")
]

for start_str, end_str in render_funcs:
    start_idx = js.find(start_str)
    if start_idx == -1:
        print(f"Could not find start for {start_str[:30]}")
        continue
        
    end_idx = js.find(end_str, start_idx)
    if end_idx == -1:
        print(f"Could not find end for {start_str[:30]}")
        continue
        
    # We want to insert requestAnimationFrame BEFORE the `};` of the render function
    injection = "                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());\n"
    js = js[:end_idx] + injection + js[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(js)
print("Successfully added reveal effects!")
