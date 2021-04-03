( function ( $ ) {

	const IntegrationView = require( './integration' );
	const RuleModel = require( './../../models/integration/rule' );

	/**
	 * Specific ThriveCart View Integration
	 * - extends from IntegrationView
	 */
	module.exports = IntegrationView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/integration-thrivecart' ),
		/**
		 * @property {jQuery}
		 */
		$checkboxRule: null,
		/**
		 * Extend Integration for this ThriveCart specific integration
		 * - if thrivecart rule exists then it is like some items have been checked
		 * @param {Object} options
		 */
		initialize: function ( options ) {

			$.extend( true, this, options );

			this.listenTo( this.rules, 'update', this.renderLabel );
			this.listenTo( this.rules, 'update', this.renderStatus );
		},
		/**
		 * Extends parent's method
		 */
		afterRender: function () {
			IntegrationView.prototype.afterRender.apply( this, arguments );
			this.$checkboxRule = this.$( '#tva-thrivecart-checkbox-rule' ).prop( 'checked', this.rules.findWhere( {integration: this.model.get( 'slug' )} ) );
		},
		/**
		 * Calculates a specific label for the thrivecart integration
		 * based on existence of rule in course rules collection
		 */
		renderLabel: function () {

			if ( this.rules.findWhere( {integration: this.model.get( 'slug' )} ) ) {
				this.$label.html( this.model.getText() );
			} else {
				this.$label.first().html( '' );
				this.$label.eq( 1 ).html( this.model.getText() );
			}
		},
		/**
		 * If the rule is defined then the integration is set
		 */
		renderStatus: function () {

			let status = this.rules.findWhere( {integration: this.model.get( 'slug' )} ) ? '&nbsp;' : 'Not set';

			this.$status.html( status );
		},
		/**
		 * Toggles a rule model in curse rules collection
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		toggleRule: function ( event, dom ) {

			if ( dom.checked && ! ( this.rules.findWhere( {integration: this.model.get( 'slug' )} ) ) ) {//add rule in collection fo rules
				const thrivecartRuleModel = new RuleModel( {
					integration: this.model.get( 'slug' )
				} );
				thrivecartRuleModel.resetItems( undefined );
				this.rules.add( thrivecartRuleModel );
			} else {
				//remove rule model from collection
				this.rules.remove( this.rules.findWhere( {integration: this.model.get( 'slug' )} ) );
			}
		}
	} );
} )( jQuery );
