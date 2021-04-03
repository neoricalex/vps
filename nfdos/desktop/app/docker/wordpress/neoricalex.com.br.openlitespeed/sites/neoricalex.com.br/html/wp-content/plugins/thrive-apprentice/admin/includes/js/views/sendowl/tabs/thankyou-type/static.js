( function ( $ ) {

	const base = require( '../../../content-base' );
	const itemState = require( '../../../item-state' );
	const pageModel = require( '../../../../models/base-page' );

	module.exports = base.extend( {
		afterInitialize: function ( options ) {

			this.model = new pageModel( TVA.settings.thankyou_page );
		},

		afterRender: function () {

			new itemState( {
				el: this.$el,
				model: this.model,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your thank you page',
					},
					normal: {
						title: 'Thank you Page',
					},
					delete: {
						title: 'Are you sure you want to remove this thank you page?',
					},
				},
				settings: {
					normal: {
						edit_with_tar: parseInt( TVA.tar_active ) === 1,
					},
				},
			} ).render();
		}
	} );

} )( jQuery() );
