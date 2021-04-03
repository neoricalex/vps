/**
 * Edit-mode utils functions
 *
 * @type {Object}
 */
const editMode = {
	/**
	 * @returns {Boolean}
	 */
	isInsideCourseEditMode: () => TVE.main.EditMode && TVE.main.EditMode.element() && TVE.main.EditMode.element().is( TVE.identifier( 'course' ) ),
	/**
	 * @returns {Boolean}
	 */
	isInternalDrag: () => typeof TVE.FLAGS.$dragged_element !== 'undefined' && ! TVE.FLAGS.$dragged_element.static_element,
	/**
	 * Toggles the Course Elements
	 *
	 * @param {boolean} show
	 */
	toggleElements: function ( show = false ) {
		TVE.main.sidebar_toggle_elements( _.map( _.filter( TVE.Elements, element => element.category === 'Apprentice Elements' ), element => element.tag ), show );
	},
};

module.exports = editMode;
