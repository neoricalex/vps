( function ( $ ) {
	/**
	 * Chapter Form View
	 */
	module.exports = require( './base' ).extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/forms/chapter' ),
		/**
		 * Binds some events after render
		 */
		afterRender: function () {
			TVE_Dash.data_binder( this );
		}
	} );
} )( jQuery );
