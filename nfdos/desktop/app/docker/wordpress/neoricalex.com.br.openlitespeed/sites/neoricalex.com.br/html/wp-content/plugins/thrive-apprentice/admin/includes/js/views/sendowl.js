( function ( $ ) {
	module.exports = require( './content-base' ).extend( {
		template: TVE_Dash.tpl( 'settings/sendowl' ),
		/**
		 * Render function for this view
		 *
		 * @returns {Backbone.View}
		 */
		render: function () {
			this.$el.html( this.template() );

			return this;
		},

		/**
		 * Changes the route to render a new view
		 *
		 * @param {Event} event
		 * @param {HTMLButtonElement} dom
		 */
		changeSendOwlView: function ( event, dom ) {
			this.changeView( dom.getAttribute( 'data-route' ) );
		}
	} );
} )( jQuery );
