const BasicIntegration = require( './../models/integration/base' );
const ThrivecartIntegration = require( './../models/integration/thrivecart' );

/**
 * List of Integration TA has to protect the content/course/module/etc
 */
module.exports = require( './base' ).extend( {

	/**
	 * @param model
	 * @param options
	 * @return {Backbone.Model}
	 */
	model: function ( model, options ) {

		if ( ! model ) {
			model = {slug: null};
		}

		switch ( model.slug ) {
			case 'thrivecart':
				return new ThrivecartIntegration( model, options );
			default:
				return new BasicIntegration.model( model, options );
		}
	},

	/**
	 * Get Items of an integration with slug
	 *
	 * @param slug
	 * @return {{Backbone.Collection}}
	 */
	getItems: function ( slug ) {

		const integration = this.findWhere( {slug: slug} );

		if ( integration instanceof BasicIntegration.model ) {
			return integration.getItems();
		}

		return new BasicIntegration.items_collection();
	},

	/**
	 * Get integration from this collection by slug
	 *
	 * @param {String} slug
	 * @return {BasicIntegration.model}
	 */
	getIntegration: function ( slug ) {

		const integration = this.findWhere( {slug: slug} );

		if ( integration instanceof BasicIntegration.model ) {
			return integration;
		}

		return new BasicIntegration.model();
	}
} );
