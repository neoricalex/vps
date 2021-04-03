module.exports = require( './base' ).extend( {
	defaults: {
		key: '',
		value: null, //Can be array|string|object
	},

	validate: function ( attrs, options ) {
		if ( ! attrs.key || attrs.value === null || typeof attrs.key !== 'string' ) {
			return this.validation_error( 'invalid_payload', 'The payload is invalid' );
		}
	},

	url: function () {
		return TVA.routes.settings_v2;
	},
} );
