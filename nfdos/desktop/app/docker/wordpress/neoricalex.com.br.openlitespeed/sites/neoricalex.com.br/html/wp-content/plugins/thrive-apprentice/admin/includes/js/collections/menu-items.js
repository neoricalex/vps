/**
 * Menu item model
 */
const model = require( './../models/base' ).extend( {
	defaults: {
		selected: false
	},
	initialize: function ( options ) {
		const items = options && options.items ? Object.values( options.items ) : [];
		this.set( 'items', new collection( items ) );
		this.set( 'sections', new Backbone.Collection( options.sections || [] ) );
	}
} );

/**
 * Collection of menu items
 * with specific model defined
 */
const collection = require( './base' ).extend( {
	model: model,
} );

module.exports = collection;
