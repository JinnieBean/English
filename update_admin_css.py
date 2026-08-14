css = """
/* =========================================
   DARK MODE FOR ADMIN
   ========================================= */
[data-theme="dark"] {
    --bg-color: #0f1f22;
    --sidebar-bg: #111f23;
    --sidebar-text: #7db5ba;
    --sidebar-hover: #1e3a3f;
    --sidebar-active-bg: #1a4a50;
    --sidebar-active-text: #7dd8e0;
    --sidebar-border: #1e3a3f;
    
    --card-bg: #162a2e;
    --border-color: #1e3a3f;
    --text-primary: #c8e6e9;
    --text-secondary: #7db5ba;
    
    --table-header: #1a4a50;
    --table-border: #1e3a3f;
    --table-row-hover: #1e3a3f;
    --input-bg: #111f23;
    --input-border: #1e3a3f;
}

[data-theme="dark"] body {
    background-color: var(--bg-color);
    color: var(--text-primary);
}

[data-theme="dark"] .sidebar {
    background: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border);
}

[data-theme="dark"] .nav-item {
    color: var(--sidebar-text);
}
[data-theme="dark"] .nav-item:hover {
    background: var(--sidebar-hover);
}
[data-theme="dark"] .nav-item.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-active-text);
}

[data-theme="dark"] .dashboard-content, [data-theme="dark"] .dashboard-header {
    background-color: transparent;
}

[data-theme="dark"] .stat-card,
[data-theme="dark"] .modal-content,
[data-theme="dark"] .auth-box,
[data-theme="dark"] div[style*="background: white"] {
    background: var(--card-bg) !important;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
}

[data-theme="dark"] .stat-card p, [data-theme="dark"] .stat-card h3, [data-theme="dark"] div[style*="color: #333"] {
    color: var(--text-primary) !important;
}

[data-theme="dark"] .input-field,
[data-theme="dark"] textarea,
[data-theme="dark"] select {
    background-color: var(--input-bg);
    border-color: var(--input-border);
    color: var(--text-primary);
}

[data-theme="dark"] .data-table th {
    background-color: var(--table-header);
    color: var(--sidebar-active-text);
    border-bottom-color: var(--table-border);
}

[data-theme="dark"] .data-table td {
    border-bottom-color: var(--table-border);
    color: var(--text-primary);
}

[data-theme="dark"] .data-table tbody tr:hover {
    background-color: var(--table-row-hover);
}
[data-theme="dark"] .btn-secondary {
    background-color: var(--input-bg);
    color: var(--text-primary);
    border-color: var(--border-color);
}
[data-theme="dark"] .btn-secondary:hover {
    background-color: var(--sidebar-hover);
}
"""
with open('d:/Data/Project/web/English/admin/css/admin.css', 'a', encoding='utf-8') as f:
    f.write(css)
print('Admin CSS updated')
