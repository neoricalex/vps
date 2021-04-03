( function ( $ ) {

	const BaseView = require( './base' );

	/**
	 * WP Media View for lesson's cover image
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'image-upload' ),
		/**
		 * @property {string} which property from model should be updated when a new media file has been chosen
		 */
		prop: 'url',
		/**
		 * @property {Object} view events
		 */
		events: {
			'click .removeImage': function () {
				this.model.set( this.prop, '' );
			},
			'click .uploadImage': function () {
				TVA.Utils.wpMedia( {}, this.model, this.prop );
			}
		},
		/**
		 * Sets some events on current model
		 * @param {Object} options
		 */
		initialize: function ( options ) {
			$.extend( true, this, options );

			this.listenTo( this.model, `change:${this.prop}`, ( model ) => {
				this.setImage( model.get( this.prop ) );
			} );
		},
		/**
		 * Puts some html in view's element
		 * @return {Backbone.View}
		 */
		render: function () {
			this.$el.html( this.template() );
			this.setImage( this.model.get( this.prop ) );

			return this;
		},
		/**
		 * Sets uploaded image as background
		 */
		setImage: function ( url ) {

			this.$( 'p' ).toggle( ! url );

			this.$el
			    .css( 'background-image', `url('${url ? url : ''}')` )
			    .toggleClass( 'w-img', !! url );
		}
	} );
} )( jQuery );
