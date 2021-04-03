const base = require( '../content-base' ),
	SendOwlAccountKeyModel = require( '../../models/sendowl-account-key' );

module.exports = base.extend( {
	template: TVE_Dash.tpl( 'settings/sendowl/integration' ),
	afterInitialize: function () {
		this.model = new SendOwlAccountKeyModel( TVA.settings.account_keys.value );
	},
	/**
	 * Triggered when the user changes the input value
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} dom
	 */
	input: function ( event, dom ) {
		const object = {};

		object[ dom.getAttribute( 'data-field' ) ] = dom.value;

		this.model.set( object );
	},
	/**
	 * Saves the
	 *
	 * @param {Event} event
	 * @param {HTMLButtonElement} dom
	 */
	save: function ( event, dom ) {

		if ( ! this.model.isValid() ) {
			TVE_Dash.err( this.model.getValidationError() );
			return;
		}

		TVE_Dash.showLoader();
		dom.setAttribute( 'disabled', 'true' );

		this.model.save( null, {
				success: ( model, response ) => {
					TVE_Dash.success( response.message );
				},
				error: ( model, response ) => {
					TVE_Dash.err( response.responseJSON.message );
				},
				complete: response => {
					TVE_Dash.hideLoader();
					dom.removeAttribute( 'disabled' );
				}
			}
		);
	},
} );
