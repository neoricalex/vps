const CourseModel = require( './../models/course' );

/**
 * Courses collection which inherits from paginator
 */
module.exports = require( './paginator' ).extend( {
	/**
	 * Specific model for this collection
	 */
	model: CourseModel,
	/**
	 * @property {number} of items per page
	 */
	limit: 10000, // this is set in order to disable pagination for courses. it does not agree at all with drag'n'drop sorting.
	/**
	 * Process an URL to fetch items from
	 * @return {string}
	 */
	url: function () {
		return this.getUrl( `${TVA.apiSettings.root}${TVA.apiSettings.v2}/courses`, jQuery.param( {
			offset: this.offset,
			limit: this.limit,
			filter: this._filter,
		} ) );
	},
	/**
	 * Returns the models that have SendOwl Integration
	 *
	 * @returns {[CourseModel]}
	 */
	getSendOwlItems: function () {
		const models = [];

		this.each( model => {
			if ( model.hasSendOwlIntegration() ) {
				models.push( model );
			}
		} );

		return models;
	},
	/**
	 * Gets next order prop value for new courses
	 * - items are ordered by order prop DESC
	 * - new order should be incremented by the first item's order
	 * @return {number}
	 */
	newItemOrder: function () {
		if ( this.length === 0 ) {
			return 0;
		}
		return parseInt( this.first().get( 'order' ) ) + 1;
	},
	/**
	 * Comparator function for the collection
	 *
	 * @param {Backbone.Model} a
	 * @param {Backbone.Model} b
	 *
	 * @returns {number}
	 */
	comparator: function ( a, b ) {
		return parseInt( b.get( 'order' ) ) - parseInt( a.get( 'order' ) );
	}
} );
