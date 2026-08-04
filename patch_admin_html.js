const fs = require('fs');
let content = fs.readFileSync('admin/index.html', 'utf8');

// 1. Add script and TinyMCE
content = content.replace(
    '<script type="module" src="js/admin.js" defer></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"></script>\n    <script type="module" src="js/admin.js" defer></script>'
);

// 2. Add sidebar tab
content = content.replace(
    '<li class="nav-item" data-tab="tab-lexical">Manage Lexical Expansion</li>',
    '<li class="nav-item" data-tab="tab-lexical">Manage Lexical Expansion</li>\n                <li class="nav-item" data-tab="tab-grammar">Manage Grammar</li>'
);

// 3. Add Tab Pane
const grammarTabPane = `
            <!-- Grammar Tab Pane -->
            <div id="tab-grammar" class="tab-pane" style="display: none;">
                <div class="dashboard-header">
                    <h2>Grammar Management</h2>
                </div>
                
                <!-- Intro Section -->
                <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3>Grammar Overview (Introduction)</h3>
                    <form id="grammar-intro-form" style="margin-top: 1rem;">
                        <div class="input-group">
                            <label>Title</label>
                            <input type="text" id="grammar-intro-title" class="input-field" value="English Grammar Overview">
                        </div>
                        <div class="input-group">
                            <label>Description (Short)</label>
                            <textarea id="grammar-intro-desc" class="input-field" rows="2"></textarea>
                        </div>
                        <div class="input-group">
                            <label>Full Content (Read More)</label>
                            <textarea id="grammar-intro-content" class="input-field tinymce-editor"></textarea>
                        </div>
                        <button type="submit" class="btn-primary">Save Introduction</button>
                    </form>
                </div>

                <!-- Categories Section -->
                <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Grammar Categories</h3>
                        <button id="add-grammar-cat-btn" class="btn-primary btn-small">+ Add Category</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Category Title</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="grammar-cat-list">
                            <!-- JS populated -->
                        </tbody>
                    </table>
                </div>

                <!-- Lessons Section -->
                <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Grammar Lessons</h3>
                        <button id="add-grammar-lesson-btn" class="btn-primary btn-small">+ Add Lesson</button>
                    </div>
                    <div class="filter-bar" style="margin-bottom: 1rem;">
                        <select id="filter-grammar-cat" class="input-field">
                            <option value="all">All Categories</option>
                            <!-- JS populated -->
                        </select>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Category</th>
                                <th>Lesson Title</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="grammar-lesson-list">
                            <!-- JS populated -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
`;
content = content.replace('</main>', grammarTabPane);

// 4. Add Modals
const grammarModals = `
    <!-- Grammar Category Modal -->
    <div id="grammar-cat-modal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-modal" data-target="grammar-cat-modal">&times;</span>
            <h2 id="grammar-cat-modal-title">Add Category</h2>
            <form id="grammar-cat-form">
                <input type="hidden" id="grammar-cat-id">
                <div class="input-group">
                    <label>Category Title</label>
                    <input type="text" id="grammar-cat-title" class="input-field" required>
                </div>
                <div class="input-group">
                    <label>Order</label>
                    <input type="number" id="grammar-cat-order" class="input-field" value="0">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('grammar-cat-modal').style.display='none'">Cancel</button>
                    <button type="submit" class="btn-primary">Save Category</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Grammar Lesson Modal -->
    <div id="grammar-lesson-modal" class="modal">
        <div class="modal-content" style="max-width: 900px; width: 90%;">
            <span class="close-modal" data-target="grammar-lesson-modal">&times;</span>
            <h2 id="grammar-lesson-modal-title">Add Lesson</h2>
            <form id="grammar-lesson-form">
                <input type="hidden" id="grammar-lesson-id">
                <div class="form-row">
                    <div class="input-group flex-1">
                        <label>Category</label>
                        <select id="grammar-lesson-category" class="input-field" required>
                            <!-- JS populated -->
                        </select>
                    </div>
                    <div class="input-group flex-1">
                        <label>Order</label>
                        <input type="number" id="grammar-lesson-order" class="input-field" value="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="input-group flex-1">
                        <label>Lesson Title</label>
                        <input type="text" id="grammar-lesson-title" class="input-field" required>
                    </div>
                    <div class="input-group flex-1">
                        <label>Author (Optional)</label>
                        <input type="text" id="grammar-lesson-author" class="input-field" placeholder="e.g. Siêu Nhân Heo Hường">
                    </div>
                </div>
                <div class="input-group">
                    <label>Content</label>
                    <textarea id="grammar-lesson-content" class="input-field tinymce-editor"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('grammar-lesson-modal').style.display='none'">Cancel</button>
                    <button type="submit" class="btn-primary">Save Lesson</button>
                </div>
            </form>
        </div>
    </div>
</body>
`;
content = content.replace('</body>', grammarModals);

fs.writeFileSync('admin/index.html', content);
