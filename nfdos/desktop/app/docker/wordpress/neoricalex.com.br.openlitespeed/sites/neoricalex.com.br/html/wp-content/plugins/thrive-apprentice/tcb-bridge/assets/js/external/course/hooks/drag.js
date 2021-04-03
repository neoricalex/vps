const EditMode = require( '../utils/edit-mode' ),
	Constants = require( '../constants' ),
	Content = require( '../content' ),
	/**
	 * @param {String} selectors
	 * @returns {String}
	 */
	noDragNDropFilter = selectors => {
		/* only continue if we're inside edit mode */
		if ( EditMode.isInsideCourseEditMode() ) {
			/*If we're dragging an element internally ( not from the sidebar ) */
			if ( EditMode.isInternalDrag() ) {
				/* there are some elements that we don't want to drag at all ( module/chapter/lesson wrappers or their list wrappers ) */
				if ( TVE.FLAGS.$dragged_element.is( '.tva-course-no-drag' ) ) {
					selectors = '#nothing-can-be-dragged';
				}
			} else {
				/**
				 * If it is not internal drag, then it means that it is drag from the sidebar
				 */
				selectors += `, ${Constants.courseSubElementSelectors[ 'course-dropzones' ]}`;
			}
		}

		return selectors;
	};

/**
 * @type {Object}
 */
const dragHooks = {
	actions: {
		/**
		 * On drag start all tve-no-drop-insid class to all couse dropzones and remove the class from the dragged element parent dropzone
		 * This solves the problem where you can drag things from one lesson to the other lesson
		 *
		 * @param {jQuery} $dragged_element
		 */
		'tcb.dragstart': $dragged_element => {
			if ( EditMode.isInsideCourseEditMode() ) {

				TVE.main.EditMode.element().find( Constants.courseSubElementSelectors[ 'course-dropzones' ] ).addClass( 'tve-no-drop-inside' );

				$dragged_element.closest( Constants.courseSubElementSelectors[ 'course-dropzones' ] ).removeClass( 'tve-no-drop-inside' );
			}
		},
	},
	filters: {
		'non_draggable': selectors => {
			if ( EditMode.isInsideCourseEditMode() ) {
				selectors += `,.${Constants.structureItemIconClass},.${Constants.toggleExpandCollapseIconClass}`;
			}

			return selectors;
		},
		/**
		 *
		 * @param allowDrag
		 * @param $element
		 *
		 * @return {boolean}
		 */
		'allow_dragenter': ( allowDrag, $element ) => {

			if ( EditMode.isInsideCourseEditMode() && $element.is( `.${Constants.structureItemIconClass},.${Constants.toggleExpandCollapseIconClass}` ) ) {
				allowDrag = false;
			}

			return allowDrag;
		},
		'dropzone_elements': noDragNDropFilter,
		/**
		 * @param {String} selectors
		 * @returns {String}
		 */
		'constrain_drop': selectors => {
			if ( EditMode.isInsideCourseEditMode() && EditMode.isInternalDrag() ) {
				selectors += `,${Constants.courseSubElementSelectors[ 'course-dropzones' ]}`;
			}

			return selectors;
		},
		/**
		 * Append the course dropzones elements to the list of only inner drop elements
		 *
		 * @param {string} selectors
		 *
		 * @return {string}
		 */
		'only_inner_drop': selectors => {
			if ( EditMode.isInsideCourseEditMode() ) {
				selectors += `,${Constants.courseSubElementSelectors[ 'course-dropzones' ]}`;
			}
			return selectors;
		},
		/**
		 * Returns the dropzone target
		 *
		 * @param $target
		 *
		 * @return {jQuery}
		 */
		'tcb.get_dropzone_target': $target => {
			if ( EditMode.isInsideCourseEditMode() ) {
				const $firstDropZone = TVE.main.EditMode.element().find( Constants.courseSubElementSelectors[ 'course-dropzones' ] ).first();

				/* if the first course dropzone exists, set the target to the last child of the first course dropzone */
				$target = $firstDropZone.length ? $firstDropZone.children().last() : $target;
			}

			return $target;
		},
	},
};

module.exports = dragHooks;
