( function ( $ ) {
	/**
	 * Specific collection for customers users
	 */
	module.exports = require( './paginator' ).extend( {
		/**
		 * {{Backbone.Model}}
		 */
		model: require( './../models/customer' ),
		/**
		 * Saves the filters and fetches from server new items based on the filters
		 * @param options
		 */
		search: function ( options ) {
			this.currentPage = 1;
			this.offset = 0;
			this.filter = {...this.filter, ...options};
			this.fetch();
		},
		/**
		 * Defines a url where the collection can be fetched
		 * - and containers specified filters
		 * @return {string}
		 */
		url: function () {

			this.filter = {
				...this.filter, ...{
					offset: this.offset,
					limit: this.limit
				}
			};

			//build the url
			return this.getUrl( TVA.routes.customer, $.param( _.pick( this.filter, value => {
				return !! value;
			} ) ) );
		}
	} );
} )( jQuery );
