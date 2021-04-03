( function ( $ ) {
	const Topics = require( './topics' );
	const Label = require( '../models/label' );
	const LabelView = require( './labels/item' );
	const UserContextView = require( './labels/user-context-item' );
	const CTAButtonView = require( './labels/cta-button' );

	module.exports = Topics.extend( {
		/**
		 * Underscore Template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'labels/dashboard' ),

		/**
		 * Labels collection
		 *
		 * @type {Backbone.Collection}
		 */
		collection: TVA.labels,

		afterInitialize() {
			Topics.prototype.afterInitialize.apply( this, arguments );

			this.settings = require( '../models/labels/dynamic-settings' );
		},

		/**
		 * Instantiate a new Label model
		 *
		 * @return {Label}
		 */
		newModel() {
			return new Label();
		},

		/**
		 * Get the container where the items should be rendered
		 *
		 * @return {JQuery}
		 */
		itemsContainer() {
			return this.$( '.tva-labels-grid' );
		},

		/**
		 * Instantiate a new Item View
		 *
		 * @param {Label} model
		 *
		 * @return {LabelView}
		 */
		newItemView( model ) {
			return new LabelView( {
				model,
				parent: this,
			} )
		},

		toggleLabelsSection( event ) {
			this.$( '.tva-user-contexts' ).toggleClass( 'tva-expanded' );
			this.settings.set( 'switch_labels', event.currentTarget.checked );
			this.settings.save();

			return false;
		},

		/**
		 * After rendering the main view, add the User Context labels and CTA button labels
		 */
		afterRender() {
			Topics.prototype.afterRender.apply( this, arguments );

			this._renderContextItems(
				this.$( '.tva-user-contexts' ),
				TVA.dynamicLabelSetup.userLabelContexts,
				UserContextView,
				key => this.settings.getUserContextLabel( key )
			);

			this._renderContextItems(
				this.$( '#tva-cta-buttons' ),
				TVA.dynamicLabelSetup.ctaLabelContexts,
				CTAButtonView,
				key => this.settings.getCTAButtonLabel( key ),
			);
		},

		/**
		 * Render a list of dynamic contexts
		 *
		 * @param $container jquery container
		 * @param items map of items to render
		 * @param ItemConstructor child view constructor
		 * @param {Function} modelGetter function used to retrieve the model
		 * @private
		 */
		_renderContextItems( $container, items, ItemConstructor, modelGetter ) {
			_.each( items, ( contextTitle, key ) => {
				const view = new ItemConstructor( {
					settings: this.settings,
					parent: this,
					contextTitle,
					model: modelGetter( key ),
				} );
				this.addChild( view );
				$container.append( view.render().$el );
			} );
		},
	} );
} )( jQuery );
