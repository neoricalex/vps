( function ( $ ) {

	/**
	 * @var {{Backbone.Collection}}
	 */
	let paginationCollection = require( './../collections/paginator' );

	/**
	 * Backbone View which renders a pagination system based on the current collection
	 * - a paginationCollection requires to be provided at instantiation
	 */
	module.exports = require( './base' ).extend( {
		/**
		 * @property template for pages/prev/next item
		 */
		template: TVE_Dash.tpl( 'pagination' ),
		/**
		 * @property noItemTemplate in case the collection is empty
		 */
		noItemTemplate: TVE_Dash.tpl( 'noItems' ),
		/**
		 * @param {{collection: paginationCollection}}options
		 */
		initialize: function ( options ) {
			if ( ! options || ! options.collection || ! ( options.collection instanceof paginationCollection ) ) {
				throw Error( 'pagination collection has to be provided for this view' );
			}

			/**
			 * Allows other views that extend this view to override templates
			 */
			$.extend( true, this, options );

			this.listenTo( this.collection, 'fetched', this.render );
			this.listenTo( this.collection, 'fetching', this.fetching );
		},
		/**
		 * Renders the pages html based on current template
		 * @return {{Backbone.View}}
		 */
		render: function () {
			let pageInfo = this.collection.pageInfo();
			if ( this.collection.length === 0 ) {
				return this.$el.html( this.noItemTemplate() );
			}

			this.$el.html( pageInfo.totalPages > 1 ? this.template( pageInfo ) : '' );
		},
		/**
		 * Callback in case prev button is clicked
		 */
		previousPage: function () {
			this.collection.prev();
		},
		/**
		 * Callback in case next button is clicked
		 */
		nextPage: function () {
			this.collection.next();
		},
		/**
		 * Callback in case the collection is fetching items from server
		 */
		fetching: function () {
			this.$el.html( 'Loading...' );
		}
	} );
} )( jQuery );
