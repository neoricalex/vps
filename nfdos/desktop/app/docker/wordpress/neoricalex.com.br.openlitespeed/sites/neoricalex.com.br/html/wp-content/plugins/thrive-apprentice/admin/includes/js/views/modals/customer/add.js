module.exports = require( './base' ).extend( {
	/**
	 * @property modal view template
	 */
	template: TVE_Dash.tpl( 'modals/add-customer' ),
	/**
	 * Called when the inputs adds a name & email address
	 *
	 * @param {Event} e
	 * @param {Element} dom
	 */
	setField: function ( e, dom ) {
		const obj = {};

		dom.getAttribute( 'data-field' ).split( ',' ).forEach( field => {
			obj[ field ] = dom.value;
		} );

		this.model.set( obj );
	},
	/**
	 * Renders list of all courses
	 * - called by parent in afterRender()
	 */
	dom: function () {
		const $coursesList = this.$( '#tva-add-customer-courses-list' ).empty();
		TVA.courses.each( ( course ) => $coursesList.append( this.courseItemTpl( {model: course} ) ) );
	},
	/**
	 * Save the customer
	 * - creates an order for the customer which has as order item selected courses
	 */
	save: function () {

		if ( ! this.model.isValid() ) {
			return TVE_Dash.err( this.model.getValidationError() );
		}

		if ( this.courses.length === 0 ) {
			return TVE_Dash.err( TVA.t.selectCourse );
		}

		this.model.set( 'services', {'course_ids': this.courses} );

		TVE_Dash.showLoader();

		this.model.save( null, {
			success: ( model, response ) => {
				TVE_Dash.success( response.message );

				if ( this.collection instanceof Backbone.Collection ) {
					this.collection.fetch();
				}
			},
			error: ( model, response ) => {
				TVE_Dash.err( response.responseJSON.message );
			},
			complete: response => {
				if ( response.status === 200 ) {
					this.close();
				}

				TVE_Dash.hideLoader();
			}
		} );
	}
} );
