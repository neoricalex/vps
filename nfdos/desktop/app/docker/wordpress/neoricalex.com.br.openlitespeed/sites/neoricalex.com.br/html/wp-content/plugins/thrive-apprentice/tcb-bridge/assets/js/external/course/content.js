const Constants = require( './constants' ),
	/* these are classes that we don't want to keep during the course save logic */
	elemDefaultClasses = [ 'tva-course', 'thrv_wrapper', 'tcb-selector-no_save', 'tve-draggable', 'tve-droppable', 'edit_mode', Constants.courseTextWarningClass ],
	stateDatasetKey = Constants.stateDatasetKey;

/**
 * Functions that modify the course element on the canvas.
 *
 * @type {Object}
 */
const Content = {
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getIdentifier: key => `.tva-course-${key}`,
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getDropzoneIdentifier: key => `.tva-course-${key === 'course' ? 'item' : `${key}`}-dropzone`,
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getListIdentifier: key => `.tva-course-${key}-list`,
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getShortcode: key => `tva_course_${key}_list`,
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getDropzoneShortcode: key => `tva_course_${key === 'course' ? '' : `${key}_`}begin`,
	/**
	 * @param {String} key
	 * @returns {String}
	 */
	getLabel: key => TVE.ucFirst( key ),
	/**
	 * Transform the course HTML into a shortcode.
	 *
	 * @param {jQuery} $content
	 */
	saveCourse: function ( $content ) {
		$content.find( TVE.identifier( 'course' ) ).each( ( index, element ) => {
				const $course = $content.find( element );
				let attr = '';

				/**
				 * Remove the style attribute from the course state selectors
				 *
				 * The show/hide logic will be handled in PHP
				 */
				$course.find( Constants.courseSubElementSelectors[ 'course-state-selector' ] ).removeAttr( 'style' );

				_.each( TVE.PostList.utils.elementAttributes( $course, [ 'data-class', 'data-id' ], true, true ), ( value, key ) => {
					attr += ` ${key}='${value}'`;
				} );

				/* save the custom classes of the element */
				let classes = '';

				$course[ 0 ].classList.forEach( _class => {
					if ( ! elemDefaultClasses.includes( _class ) && ! classes.includes( _class ) ) {
						classes += `${_class} `;
					}
				} );

				attr += classes ? ` class='${classes.trimEnd()}'` : '';

				/* Save the course id */
				if ( $course.attr( 'data-id' ) ) {
					attr += ` id='${$course.attr( 'data-id' )}'`;
				}

				if ( $course.hasClass( Constants.courseTextWarningClass ) ) {
					$course.empty();
				}

				/**
				 * Normalize the course element before deconstructing the markup into shortcodes
				 */
				Content.normalizeCourseBeforeSave( $course );

				Constants.elements.forEach( key => {
					const identifier = Content.getIdentifier( key ),
						shortcode = Content.getShortcode( key ),
						$element = $course.find( identifier );

					if ( $element.length > 1 ) {
						/* remove extra content that we don't need to parse */
						$element.not( ':first' ).remove();
					}

					Content[ `save${Content.getLabel( key )}` ]( $course, identifier, shortcode );
				} );

				Content.saveCourseDropzone( $course );

				/* wrap the content in the shortcode tags and add the attributes */
				$course.replaceWith( `[tva_course${attr}]${$course.html()}[/tva_course]` );
			}
		);
	},

	/**
	 * Normalize the  course element before save
	 *
	 * We need to make sure that course element contains all structure items before deconstructing into the shortcode string
	 *
	 * @param {jQuery} $course
	 */
	normalizeCourseBeforeSave: function ( $course ) {
		const $chapterList = $course.find( Content.getListIdentifier( 'chapter' ) ).first(),
			lessonListIdentifier = Content.getListIdentifier( 'lesson' );

		if ( $chapterList.length > 0 ) {

			const chapterListMarkup = $chapterList.find( lessonListIdentifier ).html();

			//Handles the case where there is a chapter list with an empty lesson list
			if ( typeof chapterListMarkup !== 'undefined' && chapterListMarkup.length === 0 ) {
				$chapterList.find( lessonListIdentifier ).html( $course.find( lessonListIdentifier ).filter( function () {
					return TVE.$( this ).html().length > 0;
				} ).html() );
			}

			//Normalize all content
			//Search for lessons that do not have chapters and add them chapters
			$course.find( lessonListIdentifier ).each( ( index, lessonList ) => {
				const $currentLessonList = TVE.inner_$( lessonList );

				if ( $currentLessonList.closest( Content.getListIdentifier( 'chapter' ) ).length === 0 ) {
					const $clone = $chapterList.clone();

					$currentLessonList.replaceWith( $clone.wrap( '<div></div>' ).parent().html() );
				}
			} );
		}

		/* normalize module list content */
		const $moduleList = $course.find( Content.getListIdentifier( 'module' ) ).first();

		if ( $moduleList.length > 0 ) {
			const moduleHTML = $moduleList.find( lessonListIdentifier ).html();

			/* Handles the case where there is a module list with an empty lesson list - find any populated lesson list and 'transplant' it */
			if ( typeof moduleHTML !== 'undefined' && moduleHTML.length === 0 ) {
				const populatedLessonHTML = $course.find( lessonListIdentifier ).filter( function () {
					return TVE.$( this ).html().length > 0;
				} ).html();

				/* add the populated lesson list instead of the empty one */
				$moduleList.find( lessonListIdentifier ).html( populatedLessonHTML );
			}
		}
	},

	/**
	 * Wrap the course dropzone in shortcode tags
	 * @param {jQuery} $course
	 */
	saveCourseDropzone( $course ) {
		const $courseDropzone = $course.find( Content.getDropzoneIdentifier( 'course' ) ),
			courseDropzoneShortcode = Content.getDropzoneShortcode( 'course' );

		if ( $courseDropzone.length ) {
			$courseDropzone.replaceWith( `[${courseDropzoneShortcode}]${$courseDropzone.html()}[/${courseDropzoneShortcode}]` );
		} else {
			$course.prepend( `[${courseDropzoneShortcode}][/${courseDropzoneShortcode}]` );
		}
	},
	/**
	 * Save the content of a lesson
	 *
	 * @param {jQuery} $course
	 * @param {String} identifier
	 * @param {String} shortcode
	 */
	saveLesson( $course, identifier, shortcode ) {
		const $lesson = $course.find( identifier ),
			$lessonWrapper = $lesson.closest( '.tva-course-lesson-list' );

		/* happy flow case, most of the time this happens */
		if ( $lessonWrapper.length ) {
			$lessonWrapper.replaceWith( `[${shortcode}]${$lesson.html()}[/${shortcode}]` );
		} else {
			const shortcodeString = `[${shortcode}][/${shortcode}]`;
			/* even if there's no lesson wrapper, we still have to save the shortcode brackets in case we'll have lessons in the future */
			let $target = $course.find( Content.getDropzoneIdentifier( 'chapter' ) );

			if ( ! $target.length ) {
				$target = $course.find( Content.getDropzoneIdentifier( 'module' ) );

				if ( ! $target.length ) {
					$target = $course.find( Content.getDropzoneIdentifier( 'course' ) );
				}
			}

			if ( $target.length ) {
				$target.after( shortcodeString );
			} else {
				/* if we have literally nothing, then add it inside the course wrapper */
				$course.prepend( shortcodeString );
			}
		}
	},
	/**
	 * @param {jQuery} $course
	 * @param {String} identifier
	 * @param {String} shortcode
	 */
	saveChapter( $course, identifier, shortcode ) {
		const $chapter = $course.find( identifier ),
			dropzoneShortcode = Content.getDropzoneShortcode( 'chapter' );

		/* happy flow case, most of the time this happens */
		if ( $chapter.length ) {
			const $chapterList = $chapter.closest( Content.getListIdentifier( 'chapter' ) ),
				$dropzone = $chapter.find( Content.getDropzoneIdentifier( 'chapter' ) );

			$dropzone.replaceWith( `[${dropzoneShortcode}]${$dropzone.html()}[/${dropzoneShortcode}]` );
			$chapterList.replaceWith( `[${shortcode}]${$chapter.html()}[/${shortcode}]` );
		} else {
			const openingShortcodeString = `[${shortcode}][${dropzoneShortcode}][/${dropzoneShortcode}]`;
			/* if there's no chapter, add it after the module dropzone */
			let $target = $course.find( Content.getDropzoneIdentifier( 'module' ) );

			if ( ! $target.length ) {
				/* if there's no module, add it after the course item dropzone */
				$target = $course.find( Content.getDropzoneIdentifier( 'course' ) );
			}

			if ( $target.length ) {
				$target.after( openingShortcodeString );
				$target.parent().append( `[/${shortcode}]` );
			} else {
				/* if we have literally nothing, then just add the shortcode inside the course wrapper */
				$course.prepend( openingShortcodeString );
				$course.append( `[/${shortcode}]` );
			}

		}
	},
	/**
	 * @param {jQuery} $course
	 * @param {String} identifier
	 * @param {String} shortcode
	 */
	saveModule( $course, identifier, shortcode ) {
		const $module = $course.find( identifier ),
			dropzoneShortcode = Content.getDropzoneShortcode( 'module' );

		/* happy flow case, most of the time this happens */
		if ( $module.length ) {
			const $moduleList = $module.closest( Content.getListIdentifier( 'module' ) ),
				$dropzone = $module.find( Content.getDropzoneIdentifier( 'module' ) );

			$dropzone.replaceWith( `[${dropzoneShortcode}]${$dropzone.html()}[/${dropzoneShortcode}]` );
			$moduleList.replaceWith( `[${shortcode}]${$module.html()}[/${shortcode}]` );
		} else {
			const $courseDropzone = $course.find( Content.getDropzoneIdentifier( 'course' ) ),
				openingShortcodeStirng = `[${shortcode}][${dropzoneShortcode}][/${dropzoneShortcode}]`;

			if ( $courseDropzone.length ) {
				$courseDropzone.after( openingShortcodeStirng );
			} else {
				$course.prepend( openingShortcodeStirng );
			}
			$course.append( `[/${shortcode}]` );
		}
	}, /**
	 * Initialize all the course wrapper's sub-elements ( called on tcb-ready and after replacing the course content through ajax )
	 *
	 * @param {jQuery} $course
	 */
	initCourseSubElements: $course => {
		Object.values( tcb_main_const.elements ).forEach( element => {
			if ( Object.keys( Constants.courseSubElementSelectors ).includes( element.tag ) ) {
				Content.initSubElement( element.identifier, $course );
			}
		} );
	},
	/**
	 * Initialize the sub-elements that have this tag by adding a 'thrv_wrapper' class, a data-selector and a data-shortcode
	 *
	 * @param {String} selector
	 * @param {jQuery} $wrapper
	 */
	initSubElement: ( selector, $wrapper ) => {
		const $element = $wrapper.find( selector );

		if ( $element.length ) {
			$element.addClass( 'thrv_wrapper' ).attr( 'data-selector', selector );
		}
	},
	/**
	 * Find the course item which contains this $element
	 *
	 * @param {jQuery} $element
	 * @returns {jQuery}
	 */
	getClosestCourseItem: $element => {
		return $element.closest( `${TVE.identifier( 'course-lesson' )}, ${TVE.identifier( 'course-chapter' )}, ${TVE.identifier( 'course-module' )}` );
	},
	/**
	 * Get the state that this element is currently in
	 *
	 * @param {jQuery} $element
	 * @returns {String}
	 */
	getActiveState: $element => {
		const $state = $element.closest( `[${stateDatasetKey}]` );

		return $state.length > 0 ? $state.attr( stateDatasetKey ) : '';
	},
	/**
	 * @param {jQuery} $element
	 * @returns {String}
	 */
	getActiveStateSelector: $element => {
		const state = Content.getActiveState( $element );
		/* the default state ( 0 ) has no state selector */
		let selector = state.length && parseInt( state ) !== 0 ? `[${stateDatasetKey}="${state}"]` : '';

		/* add an extra space after the selector only if the $element doesn't have a state dataset already */
		if ( selector.length && ! $element.attr( stateDatasetKey ) ) {
			selector = `${selector} `
		}

		return selector;
	},
	/**
	 * @param {jQuery} $element
	 * @param {jQuery} $course
	 * @param {String} prefix - existing prefix
	 * @returns {String}
	 */
	getPrefixedSelector: ( $element, $course, prefix = '' ) => {
		const dataCssID = TVE.CSS_Rule_Cache.uniq_id( $course ),
			courseSelector = `${Constants.courseIdentifier}[data-css="${dataCssID}"]`,
			stateSelector = Content.getActiveStateSelector( $element ),
			isCollapsed = $element.parents( '.tve-state-expanded' ).length > 0;

		prefix = `${courseSelector}${isCollapsed ? ' .tve-state-expanded' : ''} ${stateSelector.length ? `${stateSelector}` : ''}${prefix}`;

		/* change 2 spaces to 1 to avoid all sorts of issues */
		prefix = prefix.replace( /([ ]{2,})/g, ' ' );
		prefix = prefix.trimStart();

		/* make sure the base selector (usually = '#tve_editor') is the first thing in the prefix */
		if ( prefix.includes( TVE.CONST.global_css_prefix ) ) {
			prefix = TVE.CONST.global_css_prefix + ' ' + prefix.replace( TVE.CONST.global_css_prefix, '' );
		}

		return prefix;
	},
	/**
	 *
	 * @param {jQuery} $element
	 * @returns {*|boolean}
	 */
	isLesson: $element => $element.is( Constants.courseSubElementSelectors[ 'course-lesson' ] ),
	/**
	 *
	 * @param {jQuery} $element
	 * @returns {*|boolean}
	 */
	isCourseItem: $element => $element.is( Constants.courseSubElementSelectors[ 'course-dropzone' ] ),
	/**
	 * Transfer course dropzones from the old course to the new  course
	 *
	 * Returns and array of elements containing [data-css] attributes that are in the new course content
	 *
	 * @param {jQuery} $newCourse
	 * @param {jQuery} $oldCourse
	 *
	 * @return {Array}
	 */
	transferCourseContent: ( $newCourse, $oldCourse ) => {

		const selectorsDropZones = [
			Constants.courseSubElementSelectors[ 'course-dropzone' ],
			Constants.courseSubElementSelectors[ 'course-module-dropzone' ],
			Constants.courseSubElementSelectors[ 'course-chapter-dropzone' ],
			Constants.courseSubElementSelectors[ 'course-lesson' ],
		];

		let targets = [];

		selectorsDropZones.forEach( selector => {

			const $newCourseArea = $newCourse.find( selector ).first(),
				$oldCourseDropzone = $oldCourse.find( selector ).first();

			if ( $newCourseArea.length ) {
				targets = [ ...targets, ...$newCourseArea.find( '[data-css]' ).toArray() ];

				if ( $oldCourseDropzone.length ) {
					$newCourseArea.html( $oldCourseDropzone.html() );
				}
			}
		} );

		return targets;
	}
};

module.exports = Content;
