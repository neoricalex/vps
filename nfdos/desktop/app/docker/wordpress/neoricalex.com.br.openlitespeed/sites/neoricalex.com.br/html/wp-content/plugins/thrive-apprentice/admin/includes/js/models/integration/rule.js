const BaseModel = require( './base' );
const integration = require( './base' );

/**
 * Access Rule Model based on which TA protects content
 */
module.exports = BaseModel.model.extend( {

	/**
	 * Resets items collection for current rule
	 * @param items
	 * @return {exports}
	 */
	resetItems: function ( items ) {

		this.set( 'items', items instanceof Backbone.Collection ? items : new Backbone.Collection );

		return this;
	},

	/**
	 * Check if the rule has/contains the item based on ID
	 *
	 * @param item {{Backbone.Model}}
	 * @return {boolean}
	 */
	contains: function ( item ) {

		if ( ! ( item instanceof Backbone.Model ) ) {
			return false;
		}

		return this.getItems().findWhere( {id: item.getId()} ) instanceof Backbone.Model;
	},

	/**
	 * Returns a string built from name property of items collection
	 * @param {integration.model} modelIntegration
	 * @return {String}
	 */
	getItemsToString: function ( modelIntegration ) {

		let _names = [];

		if ( modelIntegration instanceof integration.model ) {
			this.get( 'items' ).each( function ( ruleItem, index ) {
				const ruleItemId = ruleItem.get( 'id' );
				const integrationItem = modelIntegration.get( 'items' ).findWhere( {id: ruleItemId} );
				if ( integrationItem instanceof Backbone.Model ) {
					_names.push( integrationItem.getName() );
				}
			} );
		} else {
			_names = this.get( 'items' ).pluck( 'name' );
		}

		if ( 0 === _names.length ) {
			_names.push( TVA.t.NoProducts );
		}

		_names = _names.join( ', ' );

		return _names;
	}
} );
