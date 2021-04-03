( function ( $ ) {
	/**
	 * Default filters for customers collection
	 * @type {{offset: number, limit: number, count: number}}
	 */
	let filters = {};

	module.exports = require( './paginator' ).extend( {
		/**
		 * Saves the filters and fetches from server new items based on the filters
		 * @param options
		 */
		search: function ( options ) {
			this.currentPage = 1;
			this.offset = 0;
			filters = {...filters, ...options};
			this.fetch();
		},
		/**
		 * Defines a url where the collection can be fetched
		 * - and containers specified filters
		 * @return {string}
		 */
		url: function () {

			filters = {
				...filters, ...{
					offset: this.offset,
					limit: this.limit
				}
			};

			//build the url
			return this.getUrl( TVA.routes.logs, $.param( _.pick( filters, value => {
				return !! value;
			} ) ) );
		}
	} );
} )( jQuery );
