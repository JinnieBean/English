const fs = require('fs');
let content = fs.readFileSync('assets/js/main.js', 'utf8');
content = content.replace(/let (\w+)Html = ""; `\w+Html \+= `/g, '$1ListContainer.innerHTML += `');
fs.writeFileSync('assets/js/main.js', content);
