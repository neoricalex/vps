( function ( $ ) {
	const UserContextItem = require( './user-context-item' );

	module.exports = UserContextItem.extend( {

		/**
		 * Underscore template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'labels/cta-button' ),

		/**
		 * Nothing needed in the afterRender function
		 */
		afterRender() {

		}

	} );
} )( jQuery );
