const COURSE_IDENTIFIER = '.tva-course',
	constants = {
		courseIdentifier: COURSE_IDENTIFIER,
		elements: [ 'lesson', 'chapter', 'module' ],
		expandCollapseSubSelectors: [ 'course-module-dropzone', 'course-chapter-dropzone' ],
		courseSubElementSelectors: {
			'course-dropzone': '.tva-course-item-dropzone',
			'course-module': '.tva-course-module',
			'course-module-dropzone': '.tva-course-module-dropzone',
			'course-module-list': '.tva-course-module-list',
			'course-chapter': '.tva-course-chapter',
			'course-chapter-dropzone': '.tva-course-chapter-dropzone',
			'course-chapter-list': '.tva-course-chapter-list',
			'course-lesson': '.tva-course-lesson',
			'course-lesson-list': '.tva-course-lesson-list',
			'course-dropzones': '.tva-course-dropzone > .tva-course-state > .tva-course-state-content, .tva-course-lesson > .tva-course-state > .tva-course-state-content', /* this isn't actually an element from PHP, but we use it to identify dropzones */
			'course-content-selectors': `.tva-course-lesson, .tva-course-chapter, .tva-course-module, ${COURSE_IDENTIFIER}`,
			'course-state-selector': '.tva-course-state',
		},
		stateDatasetKey: 'data-course-state',
		courseTextWarningClass: 'tva-course-warning-text',
		toggleExpandCollapseIconClass: 'tva-structure-toggle-icon',
		structureItemIconClass: 'tva-structure-icon',
	};

module.exports = constants;
