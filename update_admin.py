import re

file_path = "d:/Data/Project/web/English/admin/js/admin.js"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace for Grammar and Pronunciation saves
code = re.sub(
    r"(.*\.style\.display = 'none'; window\.closeTinyMCEPopups\(\);\s*(?:await )?load(?:Grammar|Pronunciation)Data\(\);)(?!\s*window\.showToast)",
    r"\1\n            window.showToast('Saved!', 'success');",
    code
)

# Replace for Grammar and Pronunciation deletes
code = re.sub(
    r"(await deleteDoc\(.*?\);\s*(?:await )?load(?:Grammar|Pronunciation)Data\(\);)(?!\s*window\.showToast)",
    r"\1\n            window.showToast('Deleted!', 'success');",
    code
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated admin.js for grammar and pronunciation toasts again!")
