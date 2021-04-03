( function ( $ ) {

	module.exports = require( './base' ).extend( {
		idAttribute: 'id',
		/**
		 * default properties
		 */
		defaults: {
			name: '',
			key: '',
			status: 1,
		},
		/**
		 * On initialize if there is no key prop set then fetch from server
		 * @param args
		 */
		initialize: function ( args ) {

			if ( ! args || ! args.key ) {
				this.generateKey();
			}
		},

		/**
		 * Fires a backend request to generate a new key
		 */
		generateKey: function () {
			$.ajax( {
				beforeSend: ( xhr ) => {
					TVE_Dash.showLoader();
					xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
				},
				url: `${this.url()}/generate`,
			} ).success( response => {
				delete response.id;

				this.set( response );
			} ).always( () => {
				TVE_Dash.hideLoader();
			} );
		},

		validate: function ( attrs, options ) {

			let errors = [];

			if ( ! this.get( 'name' ) ) {
				errors.push( this.validation_error( 'name', TVA.t.name_is_required ) )
			}

			if ( errors.length ) {
				return errors;
			}
		},
		url: function () {
			let url = TVA.routes.token;

			if ( this.get( 'id' ) ) {
				url += `/${this.get( 'id' )}`;
			}

			return url;
		},
	} );
} )( jQuery );
