/**
 * Media Model
 * - helps to store media prop in DB for a specific course item
 * @type {jQuery|void}
 */
module.exports = require( './base' ).extend( {
	/**
	 * @property {Object} default prop
	 */
	defaults: {
		options: [],
		source: '',
		type: 'youtube'
	},
	/**
	 * Validate audio media model
	 * @param {Object} data
	 * @return {undefined|[]}
	 */
	validate: function ( data = {} ) {

		const errors = [];

		if ( ! data.source ) {
			errors.push( this.validation_error( 'source', data.type === 'custom' ? TVA.t.NoEmbedCode : TVA.t.NoURL ) );
		}

		if ( errors.length ) {
			return errors;
		}
	},
	/**
	 * Allow HTML code for custom source
	 * @param {string} source
	 * @return {boolean}
	 */
	valid_bind_source: function ( source ) {

		if ( this.get( 'type' ) === 'custom' ) {
			this.set( 'source', _.escape( source ) );
			return false;
		}

		return true;
	}
} );
