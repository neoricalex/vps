module.exports = require( './base' ).extend( {
	/**
	 * Server site URL endpoint
	 *
	 * @return {string}
	 */
	url: function () {
		return TVA.routes.email_template;
	},
} );
