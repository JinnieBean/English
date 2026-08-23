import { initContentTree } from './content-tree.js';

document.addEventListener('DOMContentLoaded', () => {
    initContentTree({
        overviewContainerId: 'grammar-overview-container',
        lessonContainerId: 'grammar-lesson-container',
        categories: 'grammar_categories',
        lessons: 'grammar_lessons',
        units: 'grammar_units',
        intro: 'grammar_intro',
        lessonPage: 'grammar_lesson.html',
        overviewHref: 'grammar.html',
        cssPrefix: 'grammar',
        label: 'Grammar'
    });
});
