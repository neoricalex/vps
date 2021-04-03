( function ( $ ) {

	const base = require( '../content-base' );
	const itemState = require( './../item-state' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/sendowl/checkout' ),

		afterInitialize: function ( options ) {

			this.model = new Backbone.Model( {
				state: 'register'
			} );
		},

		afterRender: function () {

			this.$( '.tva-page-container' ).html( TVE_Dash.tpl( 'settings/sendowl/checkout-content' ) );

			new itemState( {
				el: this.$( '.tva-so-checkout-tabs' ),
				model: this.model,
				states_views_path: './sendowl/tabs/checkout-states/'
			} ).render();

			this.$( `[data-tab=${this.model.get( 'state' )}]` ).addClass( 'tva-active-tab' );
		},

		click: function ( e, dom ) {
			e.stopPropagation();

			this.model.set( 'state', dom.dataset.tab );

			this.$( '.tva-active-tab' ).removeClass( 'tva-active-tab' );
			this.$( `[data-tab=${dom.dataset.tab}]` ).addClass( 'tva-active-tab' );
		}
	} );
} )( jQuery );
