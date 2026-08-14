import re

with open('d:/Data/Project/web/English/admin/js/admin.js', 'r', encoding='utf-8') as f:
    code = f.read()

dashboard_func = """
function updateDashboardStats() {
    const elBooks = document.getElementById('stat-books');
    const elUnits = document.getElementById('stat-units');
    const elVocab = document.getElementById('stat-vocab');
    const elGrammar = document.getElementById('stat-grammar');
    
    if (elBooks) elBooks.innerText = (typeof booksData !== 'undefined') ? booksData.length : 0;
    if (elUnits) elUnits.innerText = (typeof unitsData !== 'undefined') ? unitsData.length : 0;
    if (elVocab) elVocab.innerText = (typeof vocabData !== 'undefined') ? vocabData.length : 0;
    if (elGrammar) elGrammar.innerText = (typeof grammarLessonsData !== 'undefined') ? grammarLessonsData.length : 0;
}
"""

if "function updateDashboardStats" not in code:
    code += "\n" + dashboard_func

# Inject into loadData
# Find the end of loadData. The easiest way is to find a known function call near the end, like renderLexicalTable();
if "updateDashboardStats();" not in code:
    code = re.sub(r'(renderLexicalTable\(\);)', r'\1\n        updateDashboardStats();', code)

# Inject into loadGrammarData
    code = re.sub(r'(renderGrammarLessonsTable\(\);)', r'\1\n        updateDashboardStats();', code)

with open('d:/Data/Project/web/English/admin/js/admin.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Dashboard logic injected in admin.js")
