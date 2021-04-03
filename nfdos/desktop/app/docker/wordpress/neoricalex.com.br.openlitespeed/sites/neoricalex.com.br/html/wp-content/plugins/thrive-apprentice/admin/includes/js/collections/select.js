/**
 * Specific collection for Dropdown List
 */
module.exports = require( './base' ).extend( {

	/**
	 * ID Attribute of the models from the collection
	 */
	idAttribute: 'id',

	model: require( './../models/base' ),

	/**
	 * Searches for selected model and returns it
	 *
	 * @return {{Backbone.Model}}
	 */
	getSelectedItem: function () {

		return this.findWhere( {selected: true} );
	},
	/**
	 * Sets one model passed as parameter as being selected in this collection
	 *
	 * @param {{Backbone.Model}} model
	 * @return {{Backbone.Collection}}
	 */
	setSelected: function ( model ) {

		return this.setSelectedId( model.get( this.idAttribute ) );
	},

	/**
	 * Select an option directly by its ID
	 *
	 * @param {String|Number} id ID of the model to select
	 * @param {Number} defaultId ID to select if `id` is not found in the collection
	 *
	 * @return {{Backbone.Collection}}
	 */
	setSelectedId( id, defaultId = 0 ) {
		id = parseInt( id );

		let foundModel = this.findWhere( {[ this.idAttribute ]: id} );

		if ( ! foundModel ) {
			foundModel = this.findWhere( {[ this.idAttribute ]: defaultId} );
		}

		if ( foundModel ) {
			this.each( item => item.set( 'selected', false ) );
			foundModel.set( 'selected', true );

			this.trigger( 'selectionchange', foundModel );
		}

		return this;
	}
} );
