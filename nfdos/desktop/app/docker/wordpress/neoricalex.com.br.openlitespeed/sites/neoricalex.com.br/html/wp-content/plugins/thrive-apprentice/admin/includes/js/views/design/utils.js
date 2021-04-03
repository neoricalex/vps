( function ( $ ) {

	module.exports = {

		/**
		 * Return the preview iFrame
		 *
		 * @returns {JQuery<HTMLElement>}
		 */
		getIframe: function () {
			return $( 'iframe#tva_frame' ).contents();
		},

		/**
		 * Called when iframe has been loaded
		 *
		 * Restricts the clicks inside the iframe
		 */
		iframeLoaded: function () {
			this.getIframe().find( 'a, input[type="submit"]' ).on( 'click', ( event ) => {
				event.preventDefault();
			} );
		},

		/**
		 * Adds an image logo to iframe
		 */
		addImageLogo: function () {
			$( '<img />', {
				class: 'tva-img-logo tva-resize-img'
			} ).appendTo( this.getIframe().find( '.lg' ) );
		},

		/**
		 * Returns the Logo Element
		 *
		 * @returns {JQuery<HTMLElementTagNameMap[string]>}
		 */
		getLogo: function () {
			return this.getIframe().find( '.lg img' );
		},

		/**
		 * Changes the logo in the iframe
		 *
		 * @param {Object} attr
		 * @param {Object} css
		 */
		changeLogo: function ( attr = {}, css = {} ) {
			this.getLogo().attr( attr ).css( css );
		},

		/**
		 * Changes the iframe texts based on selectors
		 *
		 * @param {String} selector
		 * @param {String} text
		 */
		changeText: function ( selector, text ) {
			this.getIframe().find( selector ).text( text );
		},

		/**
		 * Changes the attribute of an iframe element
		 *
		 * @param {String} selector
		 * @param {String} attr
		 * @param {String} value
		 */
		changeAttr: function ( selector, attr, value ) {
			this.getIframe().find( selector ).attr( attr, value );
		},

		/**
		 * Style Iframe Elements
		 *
		 * @param {String} elementSelector
		 * @param {String} prop
		 * @param {String} value
		 */
		styleIframeElements: function ( elementSelector, prop, value ) {
			const css = {};
			css[ prop ] = value;

			this.getIframe().find( elementSelector ).css( css );
		},

		/**
		 * Add font to head
		 *
		 * @param {String} url
		 */
		addFontToHead: function ( url ) {
			this.getIframe().find( '#tva_google_font' ).remove();

			this.getIframe().find( 'head' ).append( `<link rel="stylesheet" id="tva_google_font" href="${url}" type="text/css" media="all">` );
		},

		/**
		 * Changes the design main color
		 *
		 * @param {String} colorType
		 * @param {String} color
		 */
		changeMainColorCallback: function ( colorType, color ) {
			this.styleIframeElements( `.tva_${colorType}`, 'color', color );
			this.styleIframeElements( `.tva_${colorType}`, 'fill', color );
			this.styleIframeElements( `.tva_${colorType}_bg, header.tva-header ul.menu > li.h-cta`, 'background-color', color );
			this.styleIframeElements( '.tva-sidebar-container ul a', 'color', color );
			this.styleIframeElements( '.tva_text_logo_size, a.lg', 'color', color );

			/**
			 * Backwards Compatible stuff: Color on hover for the first breadcrumb element
			 */
			const $hoveredElement = this.getIframe().find( '.tva-cm-redesigned-breadcrumbs ul li a' );
			$hoveredElement.hover( function () {
				$( this ).css( 'color', color );
			}, function () {
				$( this ).css( 'color', '#666666' );
			} );
		},

		/**
		 * Preview collapsible settings
		 *
		 * @param {Object} config
		 */
		collapse: function ( config = {} ) {
			const $iframeContents = window.inner_jQuery( this.getIframe() );

			$iframeContents.find( '.tva-cm-container .tve-chapters-wrapper, .tva-cm-container .tve-lessons-wrapper' ).slideDown();

			$iframeContents.find( '.tva-cm-container' ).tva_collapsible( $.extend( {
				collapse_modules: 0,
				collapse_chapters: 0
			}, config ) );
		}
	};

} )( jQuery );
