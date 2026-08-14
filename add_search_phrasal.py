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


start_ph = "phrasalListContainer.innerHTML = '';"
end_ph = "        } catch(e) {"

start_idx = js.find(start_ph)
end_idx = js.find(end_ph, start_idx)

if start_idx != -1 and end_idx != -1:
    original_ph_code = js[start_idx:end_idx]
    
    new_loop_code = original_ph_code.replace("phrasals.forEach(p => {", "filteredList.forEach(p => {")
    new_loop_code = new_loop_code.replace("phrasalListContainer.innerHTML = '';", "phrasalListContainer.innerHTML = '';\n            if(filteredList.length === 0) { phrasalListContainer.innerHTML = '<p>No phrasal verbs found.</p>'; return; }")
    
    new_ph_code = f"""            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="phrasal-search-input" placeholder="Search phrasal verbs..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            phrasalListContainer.parentNode.insertBefore(searchContainer, phrasalListContainer);

            const renderPhrasalList = (filteredList) => {{
{new_loop_code}
            }};

            renderPhrasalList(phrasals);

            const searchInput = document.getElementById('phrasal-search-input');
            if (searchInput) {{
                searchInput.addEventListener('input', (e) => {{
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPhrasalList(phrasals);
                    const filtered = phrasals.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPhrasalList(filtered);
                }});
            }}
"""
    js = js[:start_idx] + new_ph_code + js[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully added search to Phrasal Verbs")
else:
    print("Markers not found.")
