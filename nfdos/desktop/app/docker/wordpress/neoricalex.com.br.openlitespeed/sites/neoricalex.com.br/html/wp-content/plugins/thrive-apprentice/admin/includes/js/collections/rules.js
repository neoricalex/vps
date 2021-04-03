const RuleModel = require( './../models/integration/rule' );

/**
 * List of Rules which helps TA protect content
 */
module.exports = Backbone.Collection.extend( {

	/**
	 * @property {RuleModel}
	 */
	model: RuleModel,

	/**
	 * Checks if a rules collection has integration specified as argument
	 *
	 * @param {String} integration
	 *
	 * @returns {boolean}
	 */
	hasIntegration: function ( integration ) {
		return this.findWhere( {integration: integration} ) instanceof RuleModel;
	},
	/**
	 * Checks each rule/integration if there are any items checked for at least one rule/integration
	 * @return {boolean}
	 */
	hasEmptyRules: function () {

		let hasEmpty = true;

		this.each( ( integration ) => {

			/**
			 * if the thrivecart integration is present
			 * - thrivecart has no items to be selected
			 */
			if ( integration.get( 'integration' ) === 'thrivecart' ) {
				return hasEmpty = false;
			}

			if ( hasEmpty && integration.get( 'items' ).length ) {
				hasEmpty = false;
			}
		} );

		return hasEmpty;
	},
	/**
	 * Sets all rules to have empty items collection
	 * - removes the thrivecart rule
	 */
	resetRules: function () {
		if ( this.hasIntegration( 'thrivecart' ) ) {
			this.remove( this.findWhere( {integration: 'thrivecart'} ) );
		}
		this.each( ( rule ) => rule.resetItems() );
	}
} );
