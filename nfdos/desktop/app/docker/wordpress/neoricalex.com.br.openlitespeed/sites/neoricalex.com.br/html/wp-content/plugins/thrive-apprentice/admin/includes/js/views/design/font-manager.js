( function ( $ ) {

	module.exports = {

		/**
		 * Google API url
		 */
		_api: 'https://www.googleapis.com/webfonts/v1/webfonts',

		/**
		 * Google Fonts API key
		 */
		_key: 'AIzaSyDJhU1bXm2YTz_c4VpWZrAyspOS37Nn-kI',

		/**
		 * Generate api url from font object
		 * @param font Object with family/variants/subsets
		 *
		 * @returns {string}
		 */
		generate_link: function ( font ) {
			var apiUrl = [];

			apiUrl.push( '//fonts.googleapis.com/css?family=' );
			apiUrl.push( font.family.replace( / /g, '+' ) );
			apiUrl.push( ':' );
			apiUrl.push( font.variants.join( ',' ) );
			apiUrl.push( '&subset=' );
			apiUrl.push( font.subset );

			return apiUrl.join( '' );
		},

		/**
		 * Get Google Fonts
		 *
		 * @returns {Array}
		 */
		get_google_fonts: function () {
			/* try and get google fonts from local storage */
			var fonts = TVA.Utils.LocalStorage.get( 'ta_google_fonts' );
			if ( ! fonts || ! fonts.length ) {
				/* if we don't have the fonts in the local storage we get them from the API */
				$.ajax( {
					method: 'GET',
					url: this._api,
					dataType: 'json',
					async: false,
					cache: true,
					data: {key: this._key}
				} ).done( function ( response ) {
					fonts = response.items || [];
				} ).fail( function () {
					fonts = [];
				} );
				/* and save them afterwards  */
				TVA.Utils.LocalStorage.set( 'ta_google_fonts', fonts );
			}

			return fonts;
		}
	};
} )( jQuery );
