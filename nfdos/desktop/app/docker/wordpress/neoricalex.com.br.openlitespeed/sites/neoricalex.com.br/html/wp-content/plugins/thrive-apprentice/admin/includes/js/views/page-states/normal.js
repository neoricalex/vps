( function ( $ ) {

	module.exports = require( './../content-base' ).extend( {
		template: TVE_Dash.tpl( 'login-page/states/normal' ),
		labels: {
			title: '',
		},
		settings: {
			edit_with_tar: true,
		},
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},
		render: function () {

			this.$el.html( this.template( {
				model: this.model,
				labels: this.labels,
				settings: this.settings,
			} ) );

			this.afterRender();

			return this;
		},

		removePage: function () {

			this.model.set( 'state', 'delete' );
		}
	} );

} )( jQuery );
