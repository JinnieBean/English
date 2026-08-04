const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.push('admin/index.html');
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('<div class="main-content">') && !content.includes('mobile-menu-btn')) {
      content = content.replace('<div class="main-content">', '<div class="main-content">\n            <button id="mobile-menu-btn" class="mobile-menu-btn">☰</button>');
      fs.writeFileSync(f, content, 'utf8');
      console.log('Updated ' + f);
    }
  }
});
