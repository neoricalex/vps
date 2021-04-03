/**
 * Base collection from which all others collections
 * should extend from
 */
module.exports = Backbone.Collection.extend( {
	/**
	 * Apply WP Nonce to every request to server
	 * @param method
	 * @param model
	 * @param options
	 * @return {*|boolean}
	 */
	sync: function ( method, model, options ) {
		options.beforeSend = function ( xhr ) {
			xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
		};
		return Backbone.Collection.prototype.sync.apply( this, arguments );
	},
	/**
	 * Replace a model in current collection based on model id prop
	 * @param {{Backbone.Model}} newModel
	 * @return {boolean} if the replace has been with success
	 */
	replace: function ( newModel ) {

		const existingModel = this.findWhere( {id: newModel.get( 'id' )} );

		if ( ! existingModel ) {
			return false;
		}

		const index = this.indexOf( existingModel );
		this.remove( existingModel );
		this.add( newModel, {at: index} );

		return true;
	},
	/**
	 * Updates all models in collection with new data
	 * @param {Object} options
	 */
	updateModels: function ( options ) {
		this.each( ( model ) => {
			model.set( options );
		} );
	},
	/**
	 * Get the first model with a specific id
	 *
	 * @param {Number|String} id id of the model to retrieve
	 * @param {String} idField name of the field storing the ID
	 *
	 * @return {Backbone.Model} found model or empty model if nothing is found
	 */
	findById( id, idField = 'ID' ) {
		let model = this.findWhere( {[ idField ]: parseInt( id )} );

		if ( ! model ) {
			model = new this.model;
		}

		return model;
	}
} );
