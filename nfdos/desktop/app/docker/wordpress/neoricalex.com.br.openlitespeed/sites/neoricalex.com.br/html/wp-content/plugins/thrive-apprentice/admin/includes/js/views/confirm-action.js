( function ( $ ) {

	module.exports = require( './base' ).extend( {
		/**
		 * Extends current view with new options
		 * @param {Object} options
		 */
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},
		/**
		 * Removes the view from DO because user doesn't confirm his action
		 * - defined in HTML
		 */
		cancel: function () {
			this.remove();
		},
		/**
		 * This should be overwritten or extended when this view is initialized
		 * - defined in HTML
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		confirm: function ( event, dom ) {
			this.remove();
		}
	} );
} )( jQuery );
