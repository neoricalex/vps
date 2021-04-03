( function ( $ ) {

	/**
	 * Returns the iframe element needed for the color picker to modify the color
	 *
	 * @param {Element} input
	 */
	function getIframeElementForColorPicker( input ) {
		return input.getAttribute( 'name' );
	}

	const base = require( './base' ),
		utils = require( './utils' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'design/advanced' ),
		initialize: function ( options ) {
			this.available_settings = options.available_settings;

			base.prototype.initialize.apply( this, arguments );

			TVA.design.$el.on( 'tva_iframe_loaded', () => {
				utils.collapse( this.model.get( 'template' ) );
			} );
		},
		render: function () {
			this.$el.empty().html( this.template( {
				template: this.model.get( 'template' ),
				available_settings: this.available_settings
			} ) );

			this.addColorPickers();

			return this;
		},

		/**
		 * Adds the color pickers functionality
		 */
		addColorPickers: function () {
			const self = this;

			this.$( '#tva-headline-color, #tva-paragraph-color, #tva-course-title-color' ).spectrum( {
				type: 'component',
				showPalette: false,
				showAlpha: false,
				allowEmpty: false,
				chooseText: "Apply",
				change: function ( color ) {
					const name = getIframeElementForColorPicker( this );
					self.model.get( 'template' )[ name ] = color ? color.toHexString() : '';
				},
				move: function ( color ) {
					const c = color ? color.toHexString() : '',
						name = getIframeElementForColorPicker( this ).replace( '_color', '' );

					utils.styleIframeElements( `.tva_${name}`, 'color', c );
				},
				cancel: function ( color ) {
					const c = color ? color.toHexString() : '',
						name = getIframeElementForColorPicker( this ).replace( '_color', '' );

					utils.styleIframeElements( `.tva_${name}`, 'color', c );
				}
			} );
		}
	} );
} )( jQuery );
