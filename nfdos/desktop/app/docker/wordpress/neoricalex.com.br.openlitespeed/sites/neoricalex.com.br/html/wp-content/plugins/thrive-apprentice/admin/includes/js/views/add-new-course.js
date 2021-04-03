( function ( $ ) {

	const CourseFormView = require( './course/form' );
	const CourseModel = require( './../models/course' );

	/**
	 * Save new course view which extends from course form
	 * @type {Backbone.View}
	 */
	module.exports = CourseFormView.extend( {
		/**
		 * overwrite parent initialize
		 */
		initialize: function () {
			this.model = new CourseModel();
			/**
			 * On author image change update also the dropdown view
			 */
			this.listenTo( this.model.get( 'author' ), 'change', this.onAuthorChanged );
		},
		/**
		 * overwrite parent
		 * - renders form
		 * - make course title editable
		 */
		afterRender: function () {

			this.renderForm();
			this.$( '[data-fn="editTitle"]' ).trigger( 'click' );

			//Focus on input after the input is shown
			setTimeout( () => this.$( '.title-box input' )[ 0 ].focus(), 100 );
		},
		/**
		 * Overwrites parent
		 * @return {boolean|{jqXHR}}
		 */
		saveCourse: function () {

			if ( ! this.model.isValid() ) {
				return false;
			}

			TVE_Dash.showLoader();

			return this.model.save( null, {
				success: ( model ) => {
					TVA.courses.add( model );
					this.changeView( `#courses/${model.get( 'id' )}/new` );
					TVE_Dash.hideLoader();
				},
				error: function ( model, response ) {
					TVE_Dash.hideLoader();
					TVE_Dash.err( response.responseJSON.message );
				}
			} );
		}
	} );
} )( jQuery );
