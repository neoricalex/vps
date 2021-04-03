( function ( $ ) {

	const lgPageModel = require( './../models/base-page' );
	const itemState = require( './item-state' );

	module.exports = require( './content-base' ).extend( {

		template: TVE_Dash.tpl( 'login-page/index' ),

		initialize: function () {

			this.model = new lgPageModel( TVA.settings.login_page );
		},

		render: function () {

			this.$el.html( this.template() );

			this.renderState();

			return this;
		},

		renderState: function () {

			new itemState( {
				el: this.$( '.tva-login-states-container' ),
				model: this.model,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your login & registration page',
					},
					normal: {
						title: 'Login & Registration Page',
					},
					delete: {
						title: 'Are you sure you want to remove this login & registration page?',
					},
				},
			} ).render();
		},
	} );

} )( jQuery );
