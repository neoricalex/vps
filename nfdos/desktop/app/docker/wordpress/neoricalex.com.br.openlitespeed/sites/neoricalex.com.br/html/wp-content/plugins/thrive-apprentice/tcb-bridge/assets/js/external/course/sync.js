const Constants = require( './constants' ),
	Content = require( './content' );

/**
 * Functions that sync the course element.
 *
 * @type {Object}
 */
const SyncFn = {
	/**
	 * Check if the $element is inside a course sub-item. If it is, do a course sync.
	 *
	 * @param {jQuery} $element
	 * @param {Boolean} shouldSync
	 * @return {Boolean}
	 */
	checkForCourseSync: function ( $element, shouldSync = true ) {
		const $courseItem = Content.getClosestCourseItem( $element ),
			canSync = $courseItem.length > 0 && ! SyncFn.isSyncing();

		if ( canSync && shouldSync ) {
			SyncFn.startSync();
			SyncFn.sync( $courseItem );
			SyncFn.endSync();
		}

		return canSync;
	},
	startSync: () => {
		TVE.FLAGS[ 'SYNC' ] = true;
	},
	endSync: () => {
		TVE.FLAGS[ 'SYNC' ] = false;
	},
	/**
	 * Checks if a course sync is happening
	 *
	 * @return {*}
	 */
	isSyncing: () => TVE.FLAGS[ 'SYNC' ],
	/**
	 * Synchronize the items inside the course ( lessons, chapters, modules )
	 * We take the current item that we're editing, go through all the other items, copy each shortcode and update the content according to the current item
	 *
	 * @param {jQuery} $itemTemplate the item we use as model to copy the structure in the rest of the similaritems
	 */
	sync: function ( $itemTemplate ) {
		$itemTemplate.find( '.tve-dropped' ).removeClass( 'tve-dropped' );

		const $course = $itemTemplate.parents( TVE.identifier( 'course' ) );

		/* go through all the similar items and update the dynamic/shortcode information */
		$course.find( TVE.identifier( TVE._type( $itemTemplate ) ) ).each( ( index, item ) => {
				const $item = TVE.inner_$( item ),
					itemData = SyncFn.getItemData( parseInt( item.dataset.id ), $course.attr( 'data-id' ) );

				SyncFn.syncStructureItem( $item, $itemTemplate, itemData );
			}
		);

		/* rebind the drag/resize listeners */
		TVE.drag.editorActions()
	},
	/**
	 * Copy the content of the new item to the current item in the iteration
	 *
	 * @param {jQuery} $contentToSync
	 * @param {jQuery} $contentTemplate
	 * @param {Object} itemData
	 * @param {boolean|null} syncNewContent
	 */
	syncStructureItem: function ( $contentToSync, $contentTemplate, itemData, syncNewContent = TVE.FLAGS[ 'SYNC_NEW_CONTENT' ] ) {
		/* skip the template item */
		if ( $contentTemplate.is( $contentToSync ) && ! syncNewContent ) {
			return;
		}

		const itemType = $contentTemplate.attr( 'data-type' );

		/* we only have to sync a specific area of the course item ( except for lessons, which are completely re-synced ) */
		if ( ! Content.isLesson( $contentTemplate ) ) {
			const dropzoneIdentifier = Content.getDropzoneIdentifier( itemType );

			$contentToSync = $contentToSync.find( dropzoneIdentifier );
			$contentTemplate = $contentTemplate.find( dropzoneIdentifier );
		}


		/* get a copy so we don't mess up the original content */
		const $contentTemplateClone = $contentTemplate.clone();

		if ( itemData ) {
			/* for each inline shortcode update the HTML with the dynamic data ( title, href, etc ) */
			$contentTemplateClone.find( '.thrive-shortcode-content' ).each( ( index, element ) => {
				SyncFn.syncInlineShortcode( TVE.inner_$( element ), itemData, itemType );
			} );
		}

		/* don't clone the edit mode class or the overlay class */
		$contentTemplateClone.find( '.edit_mode, .tve-element-overlay' ).removeClass( 'edit_mode tve-element-overlay' );

		/* replace the current layout with the updated clone */
		$contentToSync.html( $contentTemplateClone.html() );

		$contentTemplateClone.remove();
	},
	/**
	 * Check if the element is a shortcode. If it is, iterate over each instance of the element in the item and synchronize.
	 *
	 * @param {jQuery} $element
	 * @param {Object} itemData
	 * @param {String} itemType
	 */
	syncInlineShortcode: function ( $element, itemData, itemType ) {
		const shortcodeType = SyncFn.getShortcodeType( $element, itemType ),
			shortcode = `tva_course_${shortcodeType}`,
			/* replace the dynamic content with data from the course structure object */
			newHTML = itemData[ shortcode ];

		if ( typeof newHTML !== 'undefined' ) {
			/* if we have a dynamic link inside the shortcode, sync the text inside the link */
			if ( $element.find( 'a' ).length > 0 ) {
				$element = $element.find( 'a' );
			}
			$element.html( newHTML !== '' ? newHTML : $element.attr( 'data-shortcode-name' ) );
		} else {
			$element.empty();
		}
	},
	/**
	 * @param {Number} itemID
	 * @param {String} courseID
	 * @returns {*}
	 */
	getItemData: ( itemID, courseID ) => {
		return itemID ? TVA.courses[ parseInt( courseID ) ].content.find( element => parseInt( element.ID ) === parseInt( itemID ) ) : {};
	},

	/**
	 * Returns the course data
	 *
	 * @param {number} courseID
	 *
	 * @return {Object}
	 */
	getCourseData: courseID => {
		return TVA.courses[ courseID ];
	},
	/**
	 * Get the shortcode type by removing all the prefixes before it ( 'tva_course_module_title' --> 'title' )
	 *
	 * @param {jQuery} $element
	 * @param {String} itemType
	 * @returns {String}
	 */
	getShortcodeType: ( $element, itemType ) => $element.attr( 'data-shortcode' ).replace( ( itemType ? `tva_course_${itemType}_` : 'tva_course_' ), '' ),

	/**
	 * Sync the course elements (Module, Chapter & Lesson)
	 *
	 * @param {jQuery} $course
	 */
	syncCourse: $course => {

		const selectorsToSync = [
			Constants.courseSubElementSelectors[ 'course-module-dropzone' ],
			Constants.courseSubElementSelectors[ 'course-chapter-dropzone' ],
			Constants.courseSubElementSelectors[ 'course-lesson' ]
		];

		selectorsToSync.forEach( selector => {
			SyncFn.checkForCourseSync( $course.find( selector ).first() );
		} );

		const courseData = SyncFn.getCourseData( parseInt( $course.attr( 'data-id' ) ) );

		$course.find( `${Constants.courseSubElementSelectors[ 'course-dropzone' ]} .thrive-shortcode-content` ).each( ( index, element ) => {
			SyncFn.syncInlineShortcode( TVE.inner_$( element ), courseData, '' );
		} );
	},
};

module.exports = SyncFn;
