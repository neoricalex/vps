/**
 * Model of an Integration Item
 * An abstract Class which can be extend specifically
 * SendOwl: - product
 *          - bundle
 *
 * Usually is has and ID and a Name
 */
const item_model = Backbone.Model.extend( {
	/**
	 * Usually a Model has and ID but for this one the ID prop can be anything/string
	 * @return {*}
	 */
	getId: function () {
		return this.get( 'id' );
	},

	/**
	 * Any integration item should have a name/label to be displayed
	 * @return {*}
	 */
	getName: function () {
		return this.get( 'name' );
	}
} );

const ItemsCollection = Backbone.Collection.extend( {
	model: item_model
} );

/**
 * Each integration model should have and items/products collection
 * Usually a Plugin or an API Connection:
 * - SendOwl
 * - MemberMouse
 * - WishList
 * - etc
 */
module.exports = {
	/**
	 * @property {Backbone.Collection} of items for an integration
	 */
	itemsCollection: ItemsCollection,
	/**
	 * Base model for an Integration
	 */
	model: Backbone.Model.extend( {

		/**
		 * Initialize items as collection
		 * @param {Object} options
		 */
		initialize: function ( options ) {

			this.set( 'items', new ItemsCollection( options && options.items && Array.isArray( options.items ) ? options.items : [] ) );
		},

		/**
		 * Predefined method
		 * @return {ItemsCollection}
		 */
		getItems: function () {
			return this.get( 'items' );
		},

		/**
		 * Based on the slug property returns a text which is used for a rule model to be human readable
		 *
		 * @return {string}
		 */
		getText: function () {

			let _text = 'T: Give access if user has any of the following:';
			const _integration = TVA.t.integrations[ this.get( 'slug' ) ];

			if ( _integration ) {
				_text = _integration.rule_text;
			}

			return _text;
		}
	} )
};
