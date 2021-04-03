( function ( $ ) {

	/**
	 * Multi step modal
	 * - inherits from Thrive Dashboard
	 * @type {Backbone.View}
	 */
	module.exports = TVE_Dash.views.ModalSteps.extend( {
		/**
		 * Append specific events beside those defined in parent
		 */
		events: $.extend( TVE_Dash.views.ModalSteps.prototype.events, {
			'click .click': '_call',
			'input .input': '_call'
		} ),
		/**
		 * Bind some events to their callbacks defined in HTML
		 * @param {Event} event
		 * @return {*}
		 * @private
		 */
		_call: function ( event ) {
			const _method = event.currentTarget.dataset.fn;

			if ( typeof this[ _method ] === 'function' ) {
				return this[ _method ].call( this, event, event.currentTarget );
			}
		}
	} )
} )( jQuery );
