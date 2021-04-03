( function ( $ ) {

	const base = require( './../../content-base' );
	const pageModel = require( '../../../models/base-page' );
	const itemState = require( '../../item-state' );

	module.exports = base.extend( {

		initialize: function ( options ) {

			base.prototype.initialize.apply( this, arguments );

			this.model = new pageModel( TVA.settings.thankyou_page );
		},

		afterRender: function () {

			new itemState( {
				el: this.$el,
				model: this.model,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your register page',
					},
					normal: {
						title: TVA.t.setTyPage,
					},
					delete: {
						title: 'Are you sure you want to remove this register page?',
					},
				},
			} ).render();
		}
	} );

} )( jQuery );
