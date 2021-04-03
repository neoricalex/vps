( function ( $ ) {

	const BaseView = require( './base' );

	/**
	 * Media settings form view which handles inputs depending on types
	 * - used for lesson audio or video type
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/media/settings' ),
		/**
		 * @property {jQuery}
		 */
		$options: null,
		/**
		 * @property {jQuery}
		 */
		$types: null,
		/**
		 * @property {Array} types to be rendered for current media
		 */
		types: [],
		/**
		 * Adds some listeners for current view
		 */
		afterInitialize: function ( options ) {

			$.extend( this, options );

			this.listenTo( this.model, 'change:type', () => {
				this.model.set( 'source', '' );
				this.model.set( 'options', [] );

				this.renderOptions();

				TVE_Dash.data_binder( this );
			} );
		},
		/**
		 * Updates the view $el with html
		 */
		render: function () {

			this.$el.html( this.template( {
				model: this.model
			} ) );

			this.$types = this.$( '#tva-media-types' );
			this.types.forEach( ( type ) => {
				this.$types.append( $( '<option/>' ).val( type ).text( TVE_Dash.upperFirst( type ) ) );
			} );

			this.$types.val( this.model.get( 'type' ) );
			this.$types.select2();

			this.$options = this.$( '#tva-media-options' );

			this.renderOptions();

			TVE_Dash.data_binder( this );

			return this;
		},

		/**
		 * Renders the type options
		 */
		renderOptions: function () {
			let templateName = '';
			const mediaType = this.model.get( 'type' ).toLowerCase();

			switch ( mediaType ) {
				case 'youtube':
				case 'custom':
					templateName = 'courses/media/' + mediaType;
					break;
				default:
					templateName = 'courses/media/default';
					break;
			}

			/**
			 * based on selected media type renders a specific template with specific options
			 */
			const template = TVE_Dash.tpl( templateName );
			this.$options.html( template( {model: this.model} ) );

			Object.keys( this.model.get( 'options' ) ).forEach( ( prop, index ) => {
				this.$( 'input:checkbox[data-prop="' + prop + '"]' ).prop( 'checked', this.model.get( 'options' )[ prop ] === 1 );
			} );
		},

		/**
		 * Updates the video options
		 * - called from template HTML
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} input
		 * @return {boolean|number}
		 * - false for undefined prop on dataset
		 * - number 0 or 1 for checked box
		 */
		toggleMediaOption: function ( event, input ) {

			const prop = input.dataset.prop;

			if ( ! prop ) {
				return false;
			}

			if ( this.model.get( 'options' ).length === 0 ) {
				this.model.set( 'options', {} );
			}

			if ( event.currentTarget.checked ) {
				return this.model.get( 'options' )[ prop ] = 1;
			}

			return delete this.model.get( 'options' )[ prop ];
		}
	} );
} )( jQuery );
