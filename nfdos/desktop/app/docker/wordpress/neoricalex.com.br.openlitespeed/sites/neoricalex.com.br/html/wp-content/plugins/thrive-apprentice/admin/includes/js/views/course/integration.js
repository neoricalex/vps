( function ( $ ) {

	const RuleModel = require( './../../models/integration/rule' );
	const CourseRules = require( './../../collections/rules' );
	const BaseView = require( './../base' );

	module.exports = BaseView.extend( {
		/**
		 * @property css class for current integration element
		 */
		className: 'tva-restrictions-rule',
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/integration' ),
		/**
		 * @property {CourseRules}
		 */
		rules: null,
		/**
		 * @property {RuleModel} assigned to model for current integration
		 */
		rule: null,
		/**
		 * @property {jQuery}
		 */
		$label: null,
		/**
		 * @property {jQuery}
		 */
		$items: null,
		/**
		 * @property {jQuery}
		 */
		$status: null,
		/**
		 * @property {jQuery}
		 */
		$clearButton: null,
		/**
		 * @param {Object} options
		 */
		initialize: function ( options ) {

			$.extend( true, this, options );

			this.rule = this.rules.findWhere( {integration: this.model.get( 'slug' )} );

			if ( ! this.rule ) {
				this.rule = new RuleModel( {
					integration: this.model.get( 'slug' )
				} );
				this.rules.add( this.rule.resetItems( undefined ) );
			}

			this.listenTo( this.rule.getItems(), 'update', () => {
				this.renderLabel();
				this.renderStatus();
				this.toggleClearSelection();
			} );
			this.listenTo( this.rule.getItems(), 'reset', () => {
				this.renderLabel();
				this.renderStatus();
				this.toggleClearSelection();
			} );
		},
		/**
		 * render some extra logic/html after render
		 */
		afterRender: function () {

			this.$label = this.$( '.tva-course-integration-label, .tva-rule-label' );
			this.$rulesItem = this.$( '.tva-rule-items' );
			this.$items = this.$( '.tva-course-integration-items-wrapper' );
			this.$status = this.$( '.tva-integration-status' );
			this.$clearButton = this.$( '.tva-rule-items-clear' );

			this.model.get( 'allow' ) ? this.renderItems( this.model.getItems() ) : this.renderRestricted();

			this.renderLabel();
			this.renderStatus();
			this.toggleClearSelection();
		},
		/**
		 * Toggles css class on clear selected items button
		 */
		toggleClearSelection: function () {
			if ( ! this.rule ) {
				return;
			}
			this.$clearButton.toggleClass( 'tva-disabled', ! this.rule.getItems().length );
		},
		/**
		 * Based on items set for rule render a specific status for integration
		 */
		renderStatus: function () {
			let status = this.rule.getItems().length === 0 ? 'Not set' : '&nbsp;';

			this.$status.html( status );
		},
		/**
		 * Based on selected items calculate text for integration's label
		 */
		renderLabel: function () {

			if ( this.rule.getItems().length > 0 && this.model.get( 'allow' ) ) {
				this.$label.html( `${this.model.getText()} - ${this.rule.getItemsToString( this.model )}` );
			} else {
				this.$label.first().html( '' );
				this.$label.eq( 1 ).html( this.model.getText() );
			}
		},
		/**
		 * Render integration items based on current rule for this integration
		 * - integration item are checked if they exists in rule's items collection
		 * @param {Backbone.Collection} items of integration
		 */
		renderItems: function ( items ) {

			const template = TVE_Dash.tpl( 'courses/integration-item' );
			const $itemsWrapper = this.$items.find( '.tva-rule-items-wrapper' ).empty();

			items.each( ( integrationItem ) => {

				$itemsWrapper.append( ( () => {

					const $html = $( template( {
						id: `${this.model.get( 'slug' )}-${integrationItem.getId()}`,
						integration: this.model,
						model: integrationItem,
					} ) );

					$html.find( 'input' ).prop( 'checked', this.rule.contains( integrationItem ) );

					return $html;
				} )() )
			} );
		},
		/**
		 * Renders the restricted access integration template
		 */
		renderRestricted: function () {
			const noIntegration = TVE_Dash.tpl( `courses/restrict-integration/${this.model.get( 'slug' )}` );

			this.$rulesItem.html( noIntegration() );
		},
		/**
		 * Toggle item model to rule for current course for current integration
		 * Defined in DOM
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		toggleItem: function ( event, dom ) {

			const itemModel = this.model.getItems().findWhere( {id: this.model.get( 'slug' ) === 'wordpress' ? dom.dataset.id : parseInt( dom.dataset.id )} );

			if ( dom.checked ) {
				this.rule.getItems().add( itemModel );
				this.rule.collection.trigger( 'add' );
			} else {
				this.rule.getItems().remove( itemModel );
				this.rule.collection.trigger( 'remove' );
			}
		},
		/**
		 * Defined in DOM
		 * Toggles integration's items list
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		toggleItemsList: function ( event, dom ) {
			const $dom = $( dom );
			this.$items.toggle( ! this.$items.is( ':visible' ) );
			this.$label.first().toggle();
			$dom.find( 'span' ).toggleClass( 'i-visible', this.$items.is( ':visible' ) );
		},
		/**
		 * Uncheck the selected items
		 * Defined on DOM
		 */
		clearSelectedItems: function () {
			this.rule.getItems().reset( null );
			this.rule.collection.trigger( 'remove' );//to be caught by tab items to render the new count
			this.renderItems( this.model.getItems() );
		}
	} );
} )( jQuery );
