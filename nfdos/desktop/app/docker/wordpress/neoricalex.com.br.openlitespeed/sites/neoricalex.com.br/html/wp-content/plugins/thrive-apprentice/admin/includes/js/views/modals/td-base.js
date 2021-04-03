( function ( $ ) {
	/**
	 * Modal Base View
	 * - inherits from Thrive Dashboard Modal
	 * @type {Backbone.View}
	 */
	module.exports = TVE_Dash.views.Modal.extend( {
		/**
		 * @property {Object} events
		 */
		events: {
			'click .click': '_call',
			'input .input': '_call',
		},
		/**
		 * Call method for specific events
		 * @param {Event} event
		 * @returns {*}
		 */
		_call: function ( event ) {

			const _method = event.currentTarget.dataset.fn;

			if ( typeof this[ _method ] === 'function' ) {
				return this[ _method ].call( this, event, event.currentTarget );
			}
		}
	} );
} )( jQuery );
