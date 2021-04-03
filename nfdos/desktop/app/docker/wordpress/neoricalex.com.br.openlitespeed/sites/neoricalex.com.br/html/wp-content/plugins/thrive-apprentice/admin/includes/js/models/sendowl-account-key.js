module.exports = require( './base' ).extend( {
	defaults: {
		key: '',
		secret: '',
	},
	/**
	 * Overwrite Backbone validation
	 * Return something to invalidate the model
	 *
	 * @param {Object} attrs
	 * @param {Object} options
	 */
	validate: function ( attrs, options ) {
		const errors = [];

		if ( ! attrs.key.trim() ) {
			errors.push( this.validation_error( 'key', TVA.t.emptyKey ) );
		}

		if ( ! attrs.secret.trim() ) {
			errors.push( this.validation_error( 'secret', TVA.t.emptySecret ) );
		}

		if ( attrs.key.trim() === attrs.secret.trim() ) {
			errors.push( this.validation_error( 'key&secret', TVA.t.identicalKeys ) );
		}

		if ( errors.length ) {
			return errors;
		}
	},
	/**
	 * Server site URL endpoint
	 *
	 * @return {string}
	 */
	url: function () {
		return `${TVA.routes.sendowl}/save_account_keys`;
	},
} );
