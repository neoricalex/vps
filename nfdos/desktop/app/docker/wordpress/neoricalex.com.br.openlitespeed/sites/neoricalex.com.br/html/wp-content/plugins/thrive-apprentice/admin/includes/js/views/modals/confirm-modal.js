( function ( $ ) {
	/**
	 * Confirmation modal view
	 * - used for delete confirmation
	 * - template is required to be sent at initialization
	 * - confirmation method has to be overwritten
	 */
	module.exports = require( './td-base' ).extend( {
		/**
		 * Extends current view with options
		 * @param {Object} options
		 */
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},
		/**
		 * Closes the current modal
		 */
		confirm: function () {
			this.close();
		}
	} )
} )( jQuery );
