filepath = 'd:/Data/Project/web/English/assets/js/main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    js = f.read()

def replace_block(js, start_marker, end_marker, replacement):
    start = js.find(start_marker)
    if start == -1:
        print(f"Start marker not found: {start_marker[:30]}")
        return js
    end = js.find(end_marker, start)
    if end == -1:
        print(f"End marker not found: {end_marker[:30]}")
        return js
    return js[:start] + replacement + js[end:]


# 2. Prep Phrases
start_prep = "prepListContainer.innerHTML = '';"
end_prep = "        } catch(e) {"

start_idx = js.find(start_prep)
end_idx = js.find(end_prep, start_idx)

if start_idx != -1 and end_idx != -1:
    original_prep_code = js[start_idx:end_idx]
    
    new_loop_code = original_prep_code.replace("preps.forEach(p => {", "filteredList.forEach(p => {")
    new_loop_code = new_loop_code.replace("prepListContainer.innerHTML = '';", "prepListContainer.innerHTML = '';\n            if(filteredList.length === 0) { prepListContainer.innerHTML = '<p>No prepositional phrases found.</p>'; return; }")
    
    new_prep_code = f"""            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="prep-search-input" placeholder="Search prepositional phrases..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            prepListContainer.parentNode.insertBefore(searchContainer, prepListContainer);

            const renderPrepList = (filteredList) => {{
{new_loop_code}
            }};

            renderPrepList(preps);

            const searchInput = document.getElementById('prep-search-input');
            if (searchInput) {{
                searchInput.addEventListener('input', (e) => {{
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPrepList(preps);
                    const filtered = preps.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPrepList(filtered);
                }});
            }}
"""
    js = js[:start_idx] + new_prep_code + js[end_idx:]


# 3. Word Formation
start_wf = "wfListContainer.innerHTML = '';"
end_wf = "        } catch(e) {"

start_idx = js.find(start_wf)
end_idx = js.find(end_wf, start_idx)

if start_idx != -1 and end_idx != -1:
    original_wf_code = js[start_idx:end_idx]
    
    new_loop_code = original_wf_code.replace("wordforms.forEach(w => {", "filteredList.forEach(w => {")
    new_loop_code = new_loop_code.replace("wfListContainer.innerHTML = '';", "wfListContainer.innerHTML = '';\n            if(filteredList.length === 0) { wfListContainer.innerHTML = '<p>No word formations found.</p>'; return; }")
    
    new_wf_code = f"""            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="wf-search-input" placeholder="Search root words..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            wfListContainer.parentNode.insertBefore(searchContainer, wfListContainer);

            const renderWfList = (filteredList) => {{
{new_loop_code}
            }};

            renderWfList(wordforms);

            const searchInput = document.getElementById('wf-search-input');
            if (searchInput) {{
                searchInput.addEventListener('input', (e) => {{
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderWfList(wordforms);
                    const filtered = wordforms.filter(w => 
                        (w.rootWord || '').toLowerCase().includes(term) || 
                        (w.forms || []).some(f => (f.title || '').toLowerCase().includes(term))
                    );
                    renderWfList(filtered);
                }});
            }}
"""
    js = js[:start_idx] + new_wf_code + js[end_idx:]


# 4. Word Patterns
start_pat = "patternListContainer.innerHTML = '';"
end_pat = "        } catch(e) {"

start_idx = js.find(start_pat)
end_idx = js.find(end_pat, start_idx)

if start_idx != -1 and end_idx != -1:
    original_pat_code = js[start_idx:end_idx]
    
    new_loop_code = original_pat_code.replace("patterns.forEach(p => {", "filteredList.forEach(p => {")
    new_loop_code = new_loop_code.replace("patternListContainer.innerHTML = '';", "patternListContainer.innerHTML = '';\n            if(filteredList.length === 0) { patternListContainer.innerHTML = '<p>No word patterns found.</p>'; return; }")
    
    new_pat_code = f"""            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="pattern-search-input" placeholder="Search word patterns..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            patternListContainer.parentNode.insertBefore(searchContainer, patternListContainer);

            const renderPatternList = (filteredList) => {{
{new_loop_code}
            }};

            renderPatternList(patterns);

            const searchInput = document.getElementById('pattern-search-input');
            if (searchInput) {{
                searchInput.addEventListener('input', (e) => {{
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPatternList(patterns);
                    const filtered = patterns.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.pattern || '').toLowerCase().includes(term) ||
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPatternList(filtered);
                }});
            }}
"""
    js = js[:start_idx] + new_pat_code + js[end_idx:]


# 5. Lexical Expansion
start_lex = "lexicalListContainer.innerHTML = '';"
end_lex = "        } catch(e) {"

start_idx = js.find(start_lex)
end_idx = js.find(end_lex, start_idx)

if start_idx != -1 and end_idx != -1:
    original_lex_code = js[start_idx:end_idx]
    
    new_loop_code = original_lex_code.replace("lexicals.forEach(lex => {", "filteredList.forEach(lex => {")
    new_loop_code = new_loop_code.replace("lexicalListContainer.innerHTML = '';", "lexicalListContainer.innerHTML = '';\n            if(filteredList.length === 0) { lexicalListContainer.innerHTML = '<p>No lexical expansion found.</p>'; return; }")
    
    new_lex_code = f"""            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="lexical-search-input" placeholder="Search lexical expansions..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            lexicalListContainer.parentNode.insertBefore(searchContainer, lexicalListContainer);

            const renderLexicalList = (filteredList) => {{
{new_loop_code}
            }};

            renderLexicalList(lexicals);

            const searchInput = document.getElementById('lexical-search-input');
            if (searchInput) {{
                searchInput.addEventListener('input', (e) => {{
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderLexicalList(lexicals);
                    
                    const filtered = lexicals.filter(lex => {{
                        const inLeft = (lex.textLeft || '').toLowerCase().includes(term);
                        const inRight = (lex.textRight || '').toLowerCase().includes(term);
                        const inWords = (lex.words || []).some(w => 
                            (w.word || '').toLowerCase().includes(term) || 
                            (w.def || '').toLowerCase().includes(term)
                        );
                        return inLeft || inRight || inWords;
                    }});
                    
                    renderLexicalList(filtered);
                }});
            }}
"""
    js = js[:start_idx] + new_lex_code + js[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(js)
print("Successfully generated fully robust search features!")
