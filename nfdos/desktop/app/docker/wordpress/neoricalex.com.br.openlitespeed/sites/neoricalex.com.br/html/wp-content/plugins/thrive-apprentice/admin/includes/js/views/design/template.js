( function ( $ ) {

	const utils = require( './utils' ),
		base = require( './base' ),
		fontsViews = {
			safe: require( './fonts/safe' ),
			google: require( './fonts/google' )
		};

	TVA.Utils.FontManager = require( './font-manager' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'design/template' ),
		templateData: {},
		fontOptions: {
			safe: TVA.t.design_tab.fonts.safe,
			google: TVA.t.design_tab.fonts.google
		},
		initialize: function ( options ) {
			TVA.design.fonts.google = TVA.Utils.FontManager.get_google_fonts();

			this.frame = wp.media( {
				title: 'Select or Upload Your Logo',
				button: {
					text: 'Use this logo'
				},
				multiple: false,  // Set to true to allow multiple files to be selected
				library: {type: 'image'}
			} );

			this.frame.on( 'select', () => {
				const attachment = this.frame.state().get( 'selection' ).first().toJSON();

				if ( utils.getLogo().length === 0 ) {
					utils.addImageLogo();
				}

				utils.changeLogo( {
					'src': attachment.url,
				}, {
					'width': `${this.model.get( 'template' ).logo_size || 300}px`,
					'max-width': '600px',
					'max-height': '300px',
				} );

				this.model.get( 'template' ).logo_type = false;
				this.model.get( 'template' ).logo_url = attachment.url;

				this.render();

				//We trigger click here to open the Logo panel after the image has been added
				this.$( '.tva-logo-image' ).closest( '.tva-settings-card' ).find( '.tva-settings-card-title' ).trigger( 'click' );

				TVE_Dash.materialize( this.$el );
			} );

			base.prototype.initialize.apply( this, arguments );
		},
		render: function () {
			this.$el.empty().html( this.template( {
				model: this.model,
			} ) );

			this.templateData = this.model.get( 'template' );

			/**
			 * Render the font options - Google Fonts & Web Safe Fonts
			 */
			Object.keys( this.fontOptions ).forEach( fontOption => {
				const $option = $( '<option/>' ),
					attr = {
						value: fontOption,
					};

				if ( this.templateData.font_source === fontOption ) {
					attr.selected = true;
				}

				$option.attr( attr ).text( this.fontOptions[ fontOption ] );

				this.$( '#tva-fonts-source' ).append( $option );
			} );

			this.renderFonts( null, {value: this.templateData.font_source} );

			//Show / Hide the logo text area & Logo Image depending on the logo_type flag
			this.$( '.tva-logo-text' )[ this.templateData.logo_type ? 'show' : 'hide' ]();
			this.$( '.tva-logo-image' )[ this.templateData.logo_type ? 'hide' : 'show' ]();
			this.$( '.tva-logo-input, .tva-change-logo-button' )[ this.templateData.logo_type ? 'hide' : 'show' ]();

			const colorType = this.$( '#tva-main-color-select' ).attr( 'name' );
			this.$( '#tva-main-color-select' ).spectrum( {
				type: 'component',
				showPalette: false,
				showAlpha: false,
				allowEmpty: false,
				chooseText: "Apply",
				change: color => {
					this.model.get( 'template' )[ colorType ] = color ? color.toHexString() : '';
				},
				move: color => {
					const c = color ? color.toHexString() : '';

					utils.changeMainColorCallback( colorType, c );
				},
				cancel: color => {
					const c = color ? color.toHexString() : '';

					utils.changeMainColorCallback( colorType, c );
				}
			} );

			return this;
		},

		/**
		 * Render the font section depending on the font source
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		renderFonts: function ( event, dom ) {
			const source = dom.value;

			if ( ! fontsViews[ source ] ) {
				return;
			}

			this.fontView instanceof Backbone.View && this.fontView.removeEventsFromView();

			this.fontView = new fontsViews[ source ]( {
				el: this.$( '#tva-fonts' ),
				fonts: TVA.design.fonts[ source ],
				model: this.model,
				selected: this.templateData.font_family,
			} );

			if ( event && this.fontView instanceof Backbone.View ) {

				this.model.get( 'template' ).font_source = source;
				this.fontView.$( '.tva-fonts-select' ).trigger( 'change' );

				/**
				 * If Event is not null, this means that the user has changed the font source.
				 * In this case we need to call materialize on View Element
				 */
				TVE_Dash.materialize( this.fontView.$el );
			}
		},
		/**
		 * Callback for changing the logo
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 */
		changeLogo: function ( event, dom ) {
			this.frame.open();
		},

		/**
		 * Changes the logo type (Image / Text)
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeLogoType: function ( event, dom ) {

			this.model.get( 'template' ).logo_type = dom.checked;
			this.model.get( 'template' ).logo_url = '';

			utils.getIframe().find( '.lg' ).empty();
			this.$( '.tva-logo-image input, #tva-logo-text' ).val( '' );
			this.$( '.tva-logo-input, .tva-change-logo-button' ).toggle( ! dom.checked );
			this.$( '.tva-logo-text' ).toggle( dom.checked );
			this.$( '.tva-logo-image' ).toggle( ! dom.checked );

			if ( dom.checked ) {
				this.model.get( 'template' ).logo_size = 50;
				this.$( '#tva_logo_size_input,#tva_logo_size' ).val( this.model.get( 'template' ).logo_size )
			}
		},

		/**
		 * Override the sliderInput for a stupid implementation that has made before regarding logo element
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		sliderInput: function ( event, dom ) {
			base.prototype.sliderInput.apply( this, arguments );

			const name = dom.getAttribute( 'name' );

			if ( name === 'logo_size' ) {
				utils.styleIframeElements( '.tva-img-logo', 'width', `${dom.value}px` );

				if ( this.model.get( 'template' ).logo_type ) {
					utils.styleIframeElements( '.header-logo > a,.header-logo > a > .tva_text_logo_size', 'font-size', `${dom.value}px` );
				}
			}
		},
		/**
		 * Changes the logo text
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeLogoText: function ( event, dom ) {
			utils.changeText( '.lg', dom.value );

			utils.styleIframeElements( '.lg', 'font-size', `${this.model.get( 'template' ).logo_size}px` );
			utils.styleIframeElements( '.lg', 'color', this.model.get( 'template' ).main_color );

			this.model.get( 'template' ).logo_url = dom.value;
		}
	} );

} )( jQuery );
