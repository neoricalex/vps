module.exports = require( '../base' ).extend( {
	template: TVE_Dash.tpl( 'modals/api-key' ),
	afterInitialize: function () {
		this.listenTo( this.model, 'change:key', model => {
			this.$( '#tva-token-key' ).val( model.get( 'key' ) );
		} );
	},
	/**
	 * Called when user inputs in a text field
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} dom
	 */
	changeFiled: function ( event, dom ) {
		const field = dom.getAttribute( 'data-field' ),
			props = {};

		props[ field ] = dom.type === 'checkbox' ? Number( dom.checked ) : dom.value;

		this.model.set( props );
	},
	save: function () {
		const update = !! this.model.get( 'id' );

		if ( ! this.model.isValid() ) {
			TVE_Dash.err( this.model.getValidationError() );
			return;
		}

		TVE_Dash.showLoader();

		this.model.save( null, {
			success: ( model, response ) => {
				if ( update === false ) {
					this.collection.add( this.model );
					TVE_Dash.success( TVE_Dash.sprintf( TVA.t.token_name_saved, model.get( 'name' ) ) );
				} else {
					TVE_Dash.success( TVE_Dash.sprintf( TVA.t.token_name_saved, model.get( 'name' ) ) );
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
