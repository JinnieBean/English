import { initContentTree } from './content-tree.js';

document.addEventListener('DOMContentLoaded', () => {
    initContentTree({
        overviewContainerId: 'pronunciation-overview-container',
        lessonContainerId: 'pronunciation-lesson-container',
        categories: 'pronunciation_categories',
        lessons: 'pronunciation_lessons',
        units: 'pronunciation_units',
        intro: 'pronunciation_intro',
        lessonPage: 'pronunciation_lesson.html',
        overviewHref: 'pronunciation.html',
        cssPrefix: 'pronunciation',
        label: 'Pronunciation'
    });
});
