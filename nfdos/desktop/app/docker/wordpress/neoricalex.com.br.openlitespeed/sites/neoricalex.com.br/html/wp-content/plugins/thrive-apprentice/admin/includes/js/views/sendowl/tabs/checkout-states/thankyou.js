( function ( $ ) {

	const base = require( '../../../content-base' );
	const cards = require( './../th-page-cards' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/sendowl/thankyou-page' ),

		afterInitialize: function ( options ) {

			this.model = new Backbone.Model( {type: TVA.settings.thankyou_page_type.value} );

			this.listenTo( this.model, 'change:type', this.render );
		},

		afterRender: function () {

			this.renderCards();
			this.renderPageOptions();
		},

		renderCards: function () {
			this.cardsView = new cards( {
				el: this.$( '.tva-cards' ),
				model: this.model,
			} );

			this.cardsView.render();
		},

		renderPageOptions: function () {

			try {
				const view = require( `./../thankyou-type/${this.model.get( 'type' )}.js` );

				new view( {
					el: this.$( '.tva-thankyou-wrapper' ),
					model: this.model,
				} ).render();

			} catch ( e ) {
				console.log( e )
			}
		}
	} );

} )( jQuery );
