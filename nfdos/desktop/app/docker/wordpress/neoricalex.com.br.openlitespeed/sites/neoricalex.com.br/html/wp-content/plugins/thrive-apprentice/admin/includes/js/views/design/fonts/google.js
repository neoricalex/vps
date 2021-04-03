( function ( $ ) {
	const safe = require( './safe' ),
		utils = require( '../utils' );

	module.exports = safe.extend( {
		template: TVE_Dash.tpl( 'design/fonts/google' ),
		variants: {
			bold: [],
			regular: [],
		},

		/**
		 * Used to declare the view variables
		 */
		afterRender: function () {
			/**
			 * Dynamically called in renderVariants function
			 */
			this.$regular = this.$( '#tva-regular-select' ).empty();
			this.$bold = this.$( '#tva-bold-select' ).empty();
			this.$charset = this.$( '#tva-charset-select' ).empty();

			const fontFamily = this.model.get( 'template' ).font_family;

			this.renderVariants( fontFamily );
			this.renderCharset( fontFamily );

			return this;
		},

		/**
		 * Render the font variants dropdown
		 *
		 * @param {String} currentFontFamily
		 */
		renderVariants: function ( currentFontFamily = '' ) {
			this.variants.bold = [];
			this.variants.regular = [];

			const font = this._getFontObj( currentFontFamily );

			if ( font && Array.isArray( font.variants ) ) {
				font.variants.forEach( variant => {
					if ( variant.indexOf( 'italic' ) !== - 1 ) {
						return; // stop processing this iteration
					}

					if ( variant === 'bold' || ( /^-?\d+$/.test( variant ) && parseInt( variant ) > 400 ) ) {
						this.variants.bold.push( variant );
					} else {
						this.variants.regular.push( variant );
					}
				} );
			}

			Object.keys( this.variants ).forEach( key => {

				if ( this.variants[ key ].length === 0 ) {
					this[ '$' + key ].parent().hide();
				} else {
					//Show the Select DropDown
					this[ '$' + key ].empty().parent().show();

					//Compute the selected value
					const selected = this.model.get( 'template' )[ `font_${key}` ];

					/**
					 * Build the selected options
					 */
					this.variants[ key ].forEach( variant => {

						const $option = $( '<option/>' ),
							attr = {
								value: variant,
							};

						if ( selected === variant ) {
							attr.selected = true;
						}

						$option.attr( attr ).text( variant );
						this[ '$' + key ].append( $option );
					} );
				}
			} );
		},

		/**
		 * Render the font charset
		 *
		 * @param currentFontFamily
		 */
		renderCharset: function ( currentFontFamily = '' ) {
			const font = this._getFontObj( currentFontFamily );

			if ( font && Array.isArray( font.subsets ) && font.subsets.length ) {
				this.$charset.empty().parent().show();

				//Compute the selected value
				const selected = this.model.get( 'template' ).font_charset;

				font.subsets.forEach( subset => {

					const $option = $( '<option/>' ),
						attr = {
							value: subset,
						};

					if ( selected === subset ) {
						attr.selected = true;
					}

					$option.attr( attr ).text( subset );

					this.$charset.append( $option );
				} );
			} else {
				this.$charset.parent().hide();
			}
		},

		/**
		 * Callback when a user changes the font
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		changeFont: function ( event, dom ) {
			safe.prototype.changeFont.apply( this, arguments );

			this.renderVariants( dom.value );
			this.renderCharset( dom.value );

			this.model.get( 'template' ).font_regular = this.$regular.val();
			this.model.get( 'template' ).font_bold = this.$bold.val();
			this.model.get( 'template' ).font_charset = this.$charset.val();

			this._applyFont();

			TVE_Dash.materialize( this.$el );
		},

		/**
		 * Changes the font property: font_regular, font_bold and font_charset
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 */
		changeFontProperty: function ( event, dom ) {
			this.model.get( 'template' )[ dom.getAttribute( 'data-template-font-prop' ) ] = dom.value;
			this._applyFont();
		},

		/**
		 * Apply the font to iFrame head
		 *
		 * @private
		 */
		_applyFont: function () {
			const params = {
				family: this.model.get( 'template' ).font_family,
				variants: [ this.model.get( 'template' ).font_regular, this.model.get( 'template' ).font_bold ],
				subset: this.model.get( 'template' ).font_charset
			};

			this.model.get( 'template' ).font_url = TVA.Utils.FontManager.generate_link( params );

			utils.addFontToHead( this.model.get( 'template' ).font_url );
		},

		/**
		 * Returns the google font object or null
		 *
		 * @param {String} fontFamily
		 *
		 * @returns {Object|null}
		 * @private
		 */
		_getFontObj: function ( fontFamily = '' ) {
			return this.fonts.find( _font => _font.family === fontFamily ) || null;
		},
	} );
} )( jQuery );
