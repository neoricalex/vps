( function ( $ ) {

	const CourseItemView = require( './item' );
	const ConfirmView = require( './../confirm-action' );

	/**
	 * View for Courses Lesson rendered in course structure
	 */
	module.exports = CourseItemView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/lesson' ),
		/**
		 * @property {string} for element css class name
		 */
		className: 'tva-box tva-course-item',
		/**
		 * Shows a confirm dialog
		 * - defined in HTML
		 * - deletes current model from DB
		 * - stops propagation for deleting item by items tab view
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		deleteItem: function ( event, dom ) {
			event.stopPropagation();
			const confirmView = new ConfirmView( {
				template: TVE_Dash.tpl( 'courses/delete-lesson' ),
				className: 'tva-delete-simple',
				confirm: () => {
					let highestParent;
					if ( this.model.get( 'post_parent' ) > 0 ) {
						highestParent = this.model.getHighestParent();
					}

					this.model.destroy();

					if ( highestParent ) {
						/**
						 * This needs to be triggered so that the mass-actions element is re-rendered
						 */
						highestParent.collection.trigger( 'destroy', new Backbone.Model() );
					}

					/**
					 * This event will update the status of the course (published / draft) + update the state of the main "Publish" button
					 */
					this.course.trigger( 'tva.structure.status.changed' );
				}
			} ).render();

			$( dom ).parents( '.tva-course-item.tva_lesson' ).first().append( confirmView.$el );
		}
	} );
} )( jQuery );
