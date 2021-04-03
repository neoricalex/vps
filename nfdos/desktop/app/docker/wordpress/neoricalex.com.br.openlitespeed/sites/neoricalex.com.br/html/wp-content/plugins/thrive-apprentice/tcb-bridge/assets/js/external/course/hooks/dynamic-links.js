const LinksOptionValue = 'Apprentice course links',
	EditMode = require( '../utils/edit-mode' ),
	General = require( '../utils/utils-general' ),
	Constants = require( './../constants' ),
	SyncFn = require( './../sync' ),
	/**
	 * Callback for adding Apprentice Dynamic Links
	 *
	 * @param {jQuery} $link
	 */
	addDynamicLink = $link => {
		if ( EditMode.isInsideCourseEditMode() && General.allowApprenticeShortcodes( $link.attr( 'data-shortcode-id' ) ) ) {
			const courseID = parseInt( $link.closest( Constants.courseIdentifier ).attr( 'data-id' ) ),
				contentID = parseInt( $link.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ).attr( 'data-id' ) ),
				type = TVE._type( $link.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) ),
				course = TVA.courses[ courseID ],
				attrs = {'data-dynamic-link': $link.attr( 'data-dynamic-link' ).replace( 'course_content', type.replace( '-', '_' ) )};

			if ( courseID === contentID ) {
				attrs.href = course.tva_permalink;
			} else {
				const contentItem = course.content.find( item => item.ID === contentID );

				attrs.href = contentItem.tva_permalink;
			}

			$link.attr( attrs );

			/* propagate the changes to the other course items */
			SyncFn.checkForCourseSync( $link );
		}
	};

module.exports = {
	actions: {
		/**
		 * Setting dynamic link on a TAR element
		 *
		 * @param {jQuery} $editElement the element that is currently edited
		 * @param {jQuery} $link the actual link element
		 */
		'tcb_set_dynamic_link': ( $editElement, $link ) => {

			if ( $link.length === 0 ) {
				$link = $editElement.parent();
			}

			addDynamicLink( $link );
		},
		/**
		 * After an apprentice course dynamic link has been inserted do so logic on it
		 *
		 * @param $link
		 */
		'tcb.froala.dynamic_link_after_insert': $link => {
			addDynamicLink( $link );
		},
		/**
		 * Show the Apprentice Links Option only when in course Edit Mode
		 *
		 * @param {jQuery} $popup
		 */
		'tcb.froala.link.tab.dynamic': $popup => {

			const $dynamicSelect = $popup.find( '#fr-dynamic-category-list' ),
				type = TVE._type( TVE.ActiveElement.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) );

			/**
			 * The link option should be visible for all except course chapter
			 */
			$dynamicSelect.find( `option[value="${LinksOptionValue}"]` ).toggle( EditMode.isInsideCourseEditMode() && type !== 'course-chapter' );
		}
	},
	filters: {
		/**
		 * Modify the shortcode for Apprentice Course Links when the popup is updated
		 *
		 * called from:
		 *  - editor/js/main/views/controls/jumplinks/element-link.js
		 *  - editor/js/froala/plugins/link.js
		 *
		 * @param {string} shortcode
		 *
		 * @return {string}
		 */
		'tcb.update_dynamic_popup_shortcode': shortcode => {

			if ( EditMode.isInsideCourseEditMode() && General.allowApprenticeShortcodes( shortcode ) ) {
				shortcode = 'tva_course_content_url';
			}

			return shortcode;
		},
		/**
		 * Remove Course Element options unless Course is the element edited
		 *
		 * @param {Array} categories
		 *
		 * @return {Array}
		 */
		'tcb.render_dynamic_categories': categories => {
			const type = TVE._type( TVE.ActiveElement.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) );

			if ( ! ( EditMode.isInsideCourseEditMode() && type !== 'course-chapter' ) ) {
				const index = categories.indexOf( LinksOptionValue );

				if ( index > - 1 ) {
					categories.splice( index, 1 );
				}
			}


			return categories;
		},
	},
};
