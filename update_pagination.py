import re

with open('d:/Data/Project/web/English/admin/js/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

pagination_init = """
const paginationState = {
    vocab: { page: 1, limit: 50, maxPage: 1 },
    phrasal: { page: 1, limit: 50, maxPage: 1 },
    prep: { page: 1, limit: 50, maxPage: 1 },
    wordform: { page: 1, limit: 50, maxPage: 1 },
    pattern: { page: 1, limit: 50, maxPage: 1 },
    lexical: { page: 1, limit: 50, maxPage: 1 }
};

function addPaginationControls() {
    const tabs = ['vocab', 'phrasal', 'prep', 'wordform', 'pattern', 'lexical'];
    tabs.forEach(tab => {
        const tableContainer = document.querySelector(`#tab-${tab} .table-container`);
        if (tableContainer && !document.getElementById(`pagination-${tab}`)) {
            const pag = document.createElement('div');
            pag.className = 'pagination-controls';
            pag.id = `pagination-${tab}`;
            pag.style = "display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.9rem; color: #555;";
            pag.innerHTML = `
                <div class="pagination-info" id="pag-info-${tab}">Showing 0 - 0 of 0</div>
                <div class="pagination-buttons" style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-secondary btn-small" id="pag-prev-${tab}" style="padding: 0.2rem 0.5rem;">&lt; Prev</button>
                    <span id="pag-page-${tab}" style="font-weight: 500;">Page 1</span>
                    <button class="btn-secondary btn-small" id="pag-next-${tab}" style="padding: 0.2rem 0.5rem;">Next &gt;</button>
                </div>
                <div class="pagination-limit">
                    <select id="pag-limit-${tab}" class="input-field" style="padding: 0.2rem; margin:0; width: auto;">
                        <option value="20">20 per page</option>
                        <option value="50" selected>50 per page</option>
                        <option value="100">100 per page</option>
                        <option value="999999">All</option>
                    </select>
                </div>
            `;
            tableContainer.parentElement.appendChild(pag);
            
            document.getElementById(`pag-prev-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page > 1) {
                    paginationState[tab].page--;
                    const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                    window[renderFn]();
                }
            });
            document.getElementById(`pag-next-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page < paginationState[tab].maxPage) {
                    paginationState[tab].page++;
                    const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                    window[renderFn]();
                }
            });
            document.getElementById(`pag-limit-${tab}`).addEventListener('change', (e) => {
                paginationState[tab].limit = parseInt(e.target.value);
                paginationState[tab].page = 1;
                const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                window[renderFn]();
            });
        }
    });
}
"""

if "const paginationState" not in code:
    # insert at top
    code = code.replace('let booksData = [];', pagination_init + '\nlet booksData = [];')

# Attach addPaginationControls to loadData
if "addPaginationControls();" not in code:
    code = re.sub(r'(updateDashboardStats\(\);)', r'\1\n        addPaginationControls();', code)

# Expose window methods so button clicks can find them
exposures = """
window.renderVocab = renderVocab;
window.renderPhrasal = renderPhrasal;
window.renderPrep = renderPrep;
window.renderWordform = renderWordform;
window.renderPattern = renderPattern;
window.renderLexical = renderLexical;
"""
if "window.renderVocab =" not in code:
    code += "\n" + exposures

# Modify each render function to use pagination
def apply_pagination(code, func_name, var_name, tab_name):
    # e.g., filteredVocab.forEach
    pattern = rf'({var_name}\.forEach\()'
    replacement = f"""
    const state = paginationState['{tab_name}'];
    if (state) {{
        state.maxPage = Math.ceil({var_name}.length / state.limit) || 1;
        if (state.page > state.maxPage) state.page = state.maxPage;
        const startIdx = (state.page - 1) * state.limit;
        const endIdx = startIdx + state.limit;

        const infoEl = document.getElementById('pag-info-{tab_name}');
        const pageEl = document.getElementById('pag-page-{tab_name}');
        const prevBtn = document.getElementById('pag-prev-{tab_name}');
        const nextBtn = document.getElementById('pag-next-{tab_name}');
        
        if (infoEl) infoEl.innerText = `Showing ${{ {var_name}.length > 0 ? startIdx + 1 : 0 }} - ${{Math.min(endIdx, {var_name}.length)}} of ${{ {var_name}.length }}`;
        if (pageEl) pageEl.innerText = `Page ${{state.page}} / ${{state.maxPage}}`;
        if (prevBtn) prevBtn.disabled = state.page === 1;
        if (nextBtn) nextBtn.disabled = state.page === state.maxPage;

        {var_name} = {var_name}.slice(startIdx, endIdx);
    }}
    
    \\1"""
    return re.sub(pattern, replacement, code)

code = apply_pagination(code, 'renderVocab', 'filteredVocab', 'vocab')
code = apply_pagination(code, 'renderPhrasal', 'filteredPhrasal', 'phrasal')
code = apply_pagination(code, 'renderPrep', 'filteredPrep', 'prep')
code = apply_pagination(code, 'renderWordform', 'filteredWf', 'wordform')
code = apply_pagination(code, 'renderPattern', 'filteredPattern', 'pattern')
code = apply_pagination(code, 'renderLexical', 'filteredLexical', 'lexical')

# Wire up the Search Inputs to reset page to 1
search_listeners = [
    ("search-vocab", "vocab", "renderVocab"),
    ("search-phrasal", "phrasal", "renderPhrasal"),
    ("search-prep", "prep", "renderPrep"),
    ("search-wordform", "wordform", "renderWordform"),
    ("search-pattern", "pattern", "renderPattern"),
]
for search_id, tab, func in search_listeners:
    # Find existing event listener for input/keyup
    # like document.getElementById('search-vocab').addEventListener('input', renderVocab);
    # Replace with resetting page
    pattern = rf"document\.getElementById\('{search_id}'\)\.addEventListener\('input',\s*{func}\);"
    replacement = f"""document.getElementById('{search_id}').addEventListener('input', () => {{
        if (paginationState['{tab}']) paginationState['{tab}'].page = 1;
        {func}();
    }});"""
    code = re.sub(pattern, replacement, code)
    
    # Also for filter dropdowns (like filter-unit-select)
    # the existing is: document.getElementById('filter-unit-select').addEventListener('change', renderVocab);

with open('d:/Data/Project/web/English/admin/js/admin.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Pagination injected successfully!")
