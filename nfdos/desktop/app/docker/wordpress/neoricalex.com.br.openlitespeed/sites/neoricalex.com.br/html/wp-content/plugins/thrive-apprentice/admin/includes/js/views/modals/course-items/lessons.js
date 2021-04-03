( function ( $ ) {

	const LessonModel = require( './../../../models/lesson' );

	/**
	 * Modal for editing lesson models
	 * - extends from a base modal
	 * @type {Backbone.View}
	 */
	module.exports = require( './../td-base' ).extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'modals/courses/item' ),
		/**
		 * After modal has been rendered and opened
		 * - renders the lesson form
		 * - initialize a new lesson model if needed
		 */
		afterInitialize: function ( options = {} ) {

			if ( ! options.model ) {
				this.model = new LessonModel( {
					course_id: options.course.get( 'id' ),
					order: this.structure.length,
					post_parent: this.parentModel instanceof Backbone.Model ? this.parentModel.get( 'id' ) : 0,
					comment_status: this.parentModel instanceof Backbone.Model ? this.parentModel.get( 'comment_status' ) : 'closed'
				} );
			}
		},
		/**
		 * After the modal is opened and rendered
		 * - renders item form
		 * @return {*}
		 */
		afterRender: function () {

			const LessonFormView = require( './../../course/forms/lesson' );

			const form = new LessonFormView( {
				el: this.$_content,
				model: this.model
			} );

			form.render();

			return this;
		},
		/**
		 * Saves model to DB
		 */
		save: function () {

			const xhr = this.model.save( null, {
				success: ( model ) => {
					this.structure.add( model );

					const _cModel = TVA.courses.findWhere( {id: this.course.get( 'id' )} );

					if ( _cModel ) {
						_cModel.trigger( 'tva.structure.modified', model );
					}
				}
			} );

			if ( xhr ) {
				TVE_Dash.showLoader();
				xhr.always( () => {
					TVE_Dash.hideLoader();
					this.close();
				} );
			}
		}
	} );
} )( jQuery );
