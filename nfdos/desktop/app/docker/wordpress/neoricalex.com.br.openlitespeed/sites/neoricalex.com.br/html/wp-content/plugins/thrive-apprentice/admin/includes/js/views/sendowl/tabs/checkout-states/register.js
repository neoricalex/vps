( function ( $ ) {

	const base = require( '../../../content-base' );
	const itemState = require( '../../../item-state' );
	const pageModel = require( '../../../../models/base-page' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/sendowl/register-page' ),

		afterInitialize: function ( options ) {

			this.model = new pageModel( TVA.settings.checkout_page );
		},

		afterRender: function () {

			new itemState( {
				el: this.$( '.tva-so-checkout-reg' ),
				model: this.model,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your registration page',
					},
					normal: {
						title: 'Registration Page',
					},
					delete: {
						title: 'Are you sure you want to remove this registration page?',
					},
				},
			} ).render();

			requestAnimationFrame( TVA.Utils.rebindWistiaFancyBoxes );
		}
	} );

} )( jQuery );
