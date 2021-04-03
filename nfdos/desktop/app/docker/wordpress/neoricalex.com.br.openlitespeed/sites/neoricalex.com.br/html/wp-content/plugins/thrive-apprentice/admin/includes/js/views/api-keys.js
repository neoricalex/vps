( function ( $ ) {

	const TokenCollection = require( '../collections/tokens' ),
		TokenModel = require( '../models/token' ),
		AddModal = require( './modals/api-key/base' ),
		TokenItemView = require( './api-keys/item' );

	module.exports = require( './content-base' ).extend( {
		template: TVE_Dash.tpl( 'settings/api-keys' ),
		initialize: function () {
			this.collection = new TokenCollection( TVA.tokens );

			this.listenTo( this.collection, 'add', this.renderOne );
			this.listenTo( this.collection, 'add', this.toggleTable );
			this.listenTo( this.collection, 'toggleTable', this.toggleTable );
		},
		afterRender: function () {
			this.$apiWrapper = this.$( '#tva-api-keys-wrapper' );
			this.$noApiKeysWrapper = this.$( '#tva-no-api-keys' );

			this.toggleTable();

			this.collection.each( this.renderOne, this );
		},

		/**
		 * Toggles the API List Table depending on the collection length
		 */
		toggleTable: function () {
			const _length = this.collection.length;

			this.$apiWrapper.toggle( _length > 0 );
			this.$noApiKeysWrapper.toggle( _length === 0 );

		},

		/**
		 * Renders one collection item
		 *
		 * @param {Backbone.Model} model
		 */
		renderOne: function ( model ) {
			this.$el.append( ( new TokenItemView( {
				model: model,
				collection: this.collection
			} ) ).render().$el );
		},

		/**
		 * Opens the modal so the user can add a new key
		 *
		 * @param {Event} event
		 * @param {HTMLAnchorElement} dom
		 */
		addKey: function ( event, dom ) {
			this.openModal( AddModal, {
				model: new TokenModel(),
				collection: this.collection,
				width: '550px',
				className: 'tvd-modal tva-api-modal'
			} );
		}
	} );
} )( jQuery );
