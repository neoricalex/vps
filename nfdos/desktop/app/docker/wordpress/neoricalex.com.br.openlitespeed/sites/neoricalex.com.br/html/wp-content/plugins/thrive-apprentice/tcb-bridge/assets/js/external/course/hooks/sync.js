const similarEditClass = 'tcb_similar_edit',
	Content = require( '../content' ),
	SyncFn = require( '../sync' ),
	collapsedStateClass = '.tve-state-expanded',
	/**
	 * Shortcut for the sync function
	 * @param {jQuery} $element
	 * @returns {Boolean}
	 */
	checkForSync = $element => SyncFn.checkForCourseSync( $element );

/**
 * @type {Object}
 */
const syncHooks = {
	actions: {
		/**
		 * Action triggered after an element has been added to the page ( all cases: by drag and drop or click )
		 * When we drop an element, we check if it's inside a course item, because if it is, we have to synchronize the other items
		 *
		 * @param $element
		 */
		'tcb.after-insert': $element => {
			/* find the element to which this content belongs */
			const element = TVE.Elements[ TVE._type( $element ) ];

			if ( ! element ) {
				console.warn( 'Corresponding element not found inside TVE.Elements for:' + $element );
				return;
			}

			/* find the course item in which the content was inserted */
			const $courseItem = $element.closest( `${TVE.identifier( 'course-lesson' )}, ${TVE.identifier( 'course-chapter' )}, ${TVE.identifier( 'course-module' )}` );

			/* only do stuff if a parent course item exists */
			if ( $courseItem.length ) {
				checkForSync( $element );
			}
		},
		/**
		 * When we edit inside the course content, highlight the synced elements
		 *
		 * @param {jQuery} $element
		 */
		'tcb.element.focus': $element => {
			const $course = $element.closest( TVE.identifier( 'course' ) );

			if ( $course.length ) {
				const $courseStructureItem = $element.closest( `${TVE.identifier( 'course-lesson' )}, ${TVE.identifier( 'course-chapter' )}, ${TVE.identifier( 'course-module' )}` );

				if ( $courseStructureItem.length ) {
					const selector = TVE.identifier( TVE._type( $element ) ),
						/* look for the specific apparition index of this element, when there are more of them */
						elementIndex = $courseStructureItem.find( selector ).addBack( selector ).index( $element );

					/* highlight similar elements ( that have the same index ) from other course items */
					if ( elementIndex !== - 1 ) {
						let courseItemSelector = TVE.identifier( TVE._type( $courseStructureItem ) );

						/* only look inside course items that have a similar expanded/collapsed state */
						if ( $element.closest( collapsedStateClass ).length > 0 ) {
							courseItemSelector = `${courseItemSelector} ${collapsedStateClass}`;
						}

						$course.find( courseItemSelector ).each( ( index, courseItem ) => {
							TVE.inner_$( courseItem ).find( selector ).addBack( selector ).eq( elementIndex ).addClass( similarEditClass );
						} )
					}
				} else {
					const $courseContainer = $element.closest( '.tva-course-item-dropzone' );

					if ( $courseContainer.length > 0 && $courseContainer.find( '.tva-course-state-content:empty' ).length > 0 ) {
						TVE.toggleEnabledComponents(
							{'course-structure-item': TVE.Components[ 'course-structure-item' ]},
							false,
							'This cannot be changed if the container is empty, try adding something to the container first.'
						);
					}
				}
			}
		},
		/**
		 * Clear focus from the elements that we might have set the focus on with the 'tcb_similar_edit' class.
		 * @returns {*}
		 */
		'tcb.focus.clear': () => {
			TVE.inner.$body.find( similarEditClass ).removeClass( similarEditClass )
		},

		/**
		 * If we duplicate an element inside a course item, we sync all the items.
		 *
		 * @param $element
		 * @param $clone
		 */
		'tcb.element.duplicate': ( $element, $clone ) => {
			const $course = $element.parents( TVE.identifier( 'course' ) );

			/* if the element is a course, force-change the data-css of the clone. */
			if ( $course.length > 0 ) {
				checkForSync( $element );
			}
		},
		/**
		 * If the element that was removed was from a course item, we synchronize the templates.
		 * @see 'allow_remove' ( where TVA.$courseItemToSync is set )
		 */
		'tcb.element.remove': $element => {
			if ( TVA.$courseItemToSync ) {
				checkForSync( TVA.$courseItemToSync );
				delete TVA.$courseItemToSync;
			}
		},
		/**
		 * Triggered when we blur on a text element. If it's inside a course item, do the sync
		 * @param {Object} event
		 * @param {Object} FE
		 */
		'tcb.froala.blur': ( event, FE ) => {
			/* exit if the active element is not an element that has a froala toolbar/editor */
			if ( typeof TVE.ActiveElement === 'undefined' || ! TVE.ActiveElement.is( TVE.TEXT_ALL ) ) {
				return;
			}

			checkForSync( FE.$el );
		},
		/**
		 * Sync after resizing columns
		 *
		 * @param {Object} columns
		 */
		'tcb.columns.resized': columns => {
			if ( TVE.inner.$body.find( `[data-css="${columns[ 'left_column' ].data( 'css' )}"]` ).length ) {
				checkForSync( columns.left_column );
			}
		},
		/**
		 * Sync after rendering columns
		 */
		'tcb.columns.render': checkForSync,
		/**
		 * Sync after wrapping columns.
		 */
		'tcb.columns_wrap.change': checkForSync,
		/**
		 * Sync after rendering a divider style
		 */
		'tcb.divider_style.input': checkForSync,
		/**
		 * Sync after cancelling a divider style
		 */
		'tcb.divider_style.cancel': checkForSync,
		/**
		 * Sync after changing the decoration type
		 */
		'tcb.change_decoration': checkForSync,
		/**
		 * Triggered when an icon is changed
		 */
		'icon_element_changed': checkForSync,
		/**
		 * Sync after changing the button icon
		 */
		'tcb.button_icon.change': checkForSync,
		/**
		 * Sync after changing icon side
		 */
		'tcb.button_icon_side.change': checkForSync,
		/**
		 * Sync after changing button secondary text.
		 */
		'tcb.button_secondary_text.change': checkForSync,
		/**
		 * Sync after changing the responsive visibility ( from the desktop, tablet, mobile buttons in the 'Responsive' component ).
		 */
		'tcb.responsive_visibility_changed': checkForSync,
		/**
		 * Sync after rendering a CB placeholder
		 */
		'tcb.contentbox_placeholder.render': checkForSync,
		/**
		 * Sync after changing the alignment
		 */
		'tcb.layout.alignment_changed': checkForSync,
	},
	filters: {
		/**
		 * If we're removing an element from a course item, remember the item from where we want to remove it so we can use it to sync the rest of the items
		 * @see 'tcb.element.remove' ( TVA.$courseItemToSync is used there )
		 * @param allow
		 * @param $element
		 * @returns {*}
		 */
		'allow_remove': ( allow, $element ) => {
			const $courseItem = Content.getClosestCourseItem( $element[ 0 ] );

			if ( $courseItem.length ) {
				TVA.$courseItemToSync = $courseItem;
			}

			return allow;
		},
	},
};

module.exports = syncHooks;
