/**
 * A collection which supports pagination
 * - triggers {fetching} event before fetching new items
 * - triggers {fetched} event after new items have been fetched
 */
module.exports = require( './base' ).extend( {
	/**
	 * @property {number} offset
	 */
	offset: 0,
	/**
	 * @property {number} of items per page
	 */
	limit: parseInt( TVA.items_per_page ),
	/**
	 * @property {number} of total items in DB
	 */
	total: 0,
	/**
	 * @property {number} of current page
	 */
	currentPage: 1,

	/**
	 * Filter - map of key => value pairs to be sent to the server for filtering
	 */
	_filter: {},

	/**
	 * Adds a filter to the current collection. Resets pagination and re-fetches the collection
	 *
	 * @param {String|Object} field can either be an object( {field: valueOfField} ) or a string (fieldname)
	 * @param {String|null} value used when `field` is a string
	 */
	addFilter( field, value = null ) {
		this.resetPagination();
		if ( typeof field === 'string' ) {
			field = {[ field ]: value};
		}
		this._filter = {
			...this._filter,
			...field,
		};
		this.fetch();
	},

	/**
	 * Get a filter by key, or all filters if no key is provided
	 *
	 * @param {String} key
	 * @param {*} [def] default value to return if no filter exists
	 */
	getFilter( key, def = null ) {
		if ( typeof key === 'undefined' ) {
			return this._filter;
		}

		if ( typeof this._filter[ key ] === 'undefined' ) {
			return def;
		}

		return this._filter[ key ];
	},

	/**
	 * Reset all pagination options
	 *
	 * @return {Backbone.Collection}
	 */
	resetPagination() {
		this.currentPage = 1;
		this.offset = 0;

		return this;
	},

	/**
	 * Checks if the pagination collection has filters
	 *
	 * @returns {boolean}
	 */
	hasFilters() {
		const filters = this._filter;
		if ( filters.topic && parseInt( filters.topic ) === - 1 ) {
			/**
			 * All topics has -1 as value, therefore, we need to exclude it in hasFilters check
			 */
			delete filters.topic;
		}

		return Object.keys( filters ).length > 0;
	},
	/**
	 * Reset all filters
	 *
	 * @return {Backbone.Collection}
	 */
	resetFilters() {
		this._filter = {};

		return this;
	},
	/**
	 *
	 * @param {Array} models to populate the collection
	 * @param {{total: number}} options to set on current instance
	 */
	initialize: function ( models, options ) {

		if ( ! options || typeof options.total === 'undefined' ) {
			throw new Error( 'This collection cannot be initialized without total count of items' );
		}

		this.total = parseInt( options.total );
	},
	/**
	 * Overwrite the base fetch so that custom events could be triggered
	 * @param {Object} [options]
	 * @return {*|Promise<Response>|Promise<Response>}
	 */
	fetch: function ( options = {} ) {
		this.trigger( 'fetching' );
		options.success = () => {
			/**
			 * triggers and event which has current collection as first argument
			 * - useful at rendering items list in view
			 */
			this.trigger( 'fetched', this );
			/* can happen in cases where the collection is filtered and the single course on the last page does not match the filter anymore */
			if ( ! this.length && this.currentPage > 1 ) {
				this.prev(); // display the previous page
			}
		};
		return Backbone.Collection.prototype.fetch.call( this, options );
	},
	/**
	 * A specific response is expected to be served by the server
	 * so that the collection can be updated
	 * @param {{total: number, items:[]}}response
	 * @return {*}
	 */
	parse: function ( response ) {
		if ( response && typeof response.total !== 'undefined' ) {
			this.total = response.total;
		}
		return response && response.items;
	},
	/**
	 * Increment the current page and calculates the new offset
	 * - fetches new items based on properties
	 * @return {{Backbone.Collection}}
	 */
	next: function () {
		this.currentPage ++;
		this.offset = ( this.currentPage - 1 ) * this.limit;
		this.fetch();
		return this;
	},
	/**
	 * Decrement the current page and calculates the new offset
	 * - fetches new items based on properties
	 * @return {{Backbone.Collection}}
	 */
	prev: function () {
		this.currentPage --;
		this.offset = ( this.currentPage - 1 ) * this.limit;
		this.fetch();
		return this;
	},
	/**
	 * Based on current items returns them to be used outside:
	 * - used on pagination template
	 * @return {{next: boolean, prev: boolean, totalPages: number, page: *, currentPage: *}}
	 */
	pageInfo: function () {
		return {
			currentPage: this.currentPage,
			totalPages: Math.ceil( this.total / this.limit ),
			page: this.currentPage,
			prev: this.offset > 0,
			next: ( this.currentPage * this.limit ) < this.total,
		}
	},
	/**
	 * Computes the url needed for the collection
	 * Handles the case with different permalink structure
	 *
	 * @param {String} base
	 * @param {String} queryStrings
	 *
	 * @return {string}
	 */
	getUrl: function ( base, queryStrings ) {
		return `${base}${base.includes( '?' ) ? '&' : '?'}${queryStrings}`;
	}
} );
