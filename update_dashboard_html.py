import re

with open('d:/Data/Project/web/English/admin/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Insert Dashboard link in sidebar
html = html.replace('<ul class="sidebar-nav">', '<ul class="sidebar-nav">\n                <li class="nav-item active" data-tab="tab-dashboard" title="Dashboard"><i class="fas fa-chart-line"></i><span class="nav-text">Dashboard</span></li>')

# Remove active from books tab link if present
html = html.replace('<li class="nav-item active" data-tab="tab-books"', '<li class="nav-item" data-tab="tab-books"')

# Insert Dashboard pane
dashboardPane = """
            <!-- Dashboard Tab -->
            <div id="tab-dashboard" class="tab-pane active">
                <div class="dashboard-header">
                    <h2>Overview Dashboard</h2>
                </div>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                    <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem;">
                        <div class="stat-icon" style="font-size: 2.5rem; color: #0d9caa;"><i class="fas fa-book"></i></div>
                        <div><h3 style="font-size: 0.9rem; color: #666; margin: 0;">Total Books</h3><p id="stat-books" style="font-size: 1.8rem; font-weight: bold; margin: 0.2rem 0 0; color: #333;">...</p></div>
                    </div>
                    <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem;">
                        <div class="stat-icon" style="font-size: 2.5rem; color: #0d9caa;"><i class="fas fa-layer-group"></i></div>
                        <div><h3 style="font-size: 0.9rem; color: #666; margin: 0;">Total Units</h3><p id="stat-units" style="font-size: 1.8rem; font-weight: bold; margin: 0.2rem 0 0; color: #333;">...</p></div>
                    </div>
                    <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem;">
                        <div class="stat-icon" style="font-size: 2.5rem; color: #0d9caa;"><i class="fas fa-font"></i></div>
                        <div><h3 style="font-size: 0.9rem; color: #666; margin: 0;">Total Vocabulary</h3><p id="stat-vocab" style="font-size: 1.8rem; font-weight: bold; margin: 0.2rem 0 0; color: #333;">...</p></div>
                    </div>
                    <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem;">
                        <div class="stat-icon" style="font-size: 2.5rem; color: #0d9caa;"><i class="fas fa-pen-nib"></i></div>
                        <div><h3 style="font-size: 0.9rem; color: #666; margin: 0;">Grammar Lessons</h3><p id="stat-grammar" style="font-size: 1.8rem; font-weight: bold; margin: 0.2rem 0 0; color: #333;">...</p></div>
                    </div>
                </div>
            </div>
"""
html = html.replace('<!-- Books Tab -->', dashboardPane + '\n            <!-- Books Tab -->')

# Remove active class from tab-books content pane
html = html.replace('<div id="tab-books" class="tab-pane active">', '<div id="tab-books" class="tab-pane" style="display: none;">')

with open('d:/Data/Project/web/English/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Admin HTML updated with dashboard.")
