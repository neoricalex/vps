( function ( $ ) {

	const ELEMENT_LOADER_TEMPLATE = `<div class="tvd-card-preloader tva-element-loader"><div class="tvd-preloader-wrapper tvd-active"><div class="tvd-spinner-layer tvd-spinner-blue-only"><div class="tvd-circle-clipper tvd-left"><div class="tvd-circle"></div></div><div class="tvd-gap-patch"><div class="tvd-circle"></div></div><div class="tvd-circle-clipper tvd-right"><div class="tvd-circle"></div></div></div></div></div>`;

	/**
	 * Show/hides an ajax loader over an element.
	 *
	 * @param {Number|String|false} [size] size of the spinner. can be a Number (pixels) or a CSS string. If Boolean FALSE, it will hide the loader
	 * @param {Boolean} [state] if sent, it will force showing (for true) or hiding (for false)
	 * @param {Object} [options] various options for positioning and styling the wrapper
	 *
	 * @return {JQuery}
	 */
	$.fn.tvaToggleLoader = function ( size = 20, state = null, options = {} ) {
		if ( typeof size === 'number' ) {
			size = size + 'px'; // consider 'px' as the uom
		}

		const DEFAULT_OPTIONS = {
			position: 'center',
			background: 'rgba(255, 255, 255, .8)',
			fadeDuration: 100,
		};

		options = {
			...DEFAULT_OPTIONS,
			...options,
		};

		const {position, background, padding} = options;
		/* force hide the loader */
		if ( size === false ) {
			state = false;
		}

		return this.each( function () {
			const $el = $( this );
			const hasLoader = this.classList.contains( 'tva-element-loading' );

			/* remove loader if state is false or null, or if it already has a loader */
			$el.find( '.tvd-card-preloader.tva-element-loader' ).fadeOut( options.fadeDuration, function () {
				$( this ).remove();
				$el.removeClass( 'tva-disabled tva-element-loading' ).css( 'position', '' );
			} ).length || $el.removeClass( 'tva-disabled tva-element-loading' ).css( 'position', '' );

			if ( state === false || ( state !== true && hasLoader ) ) {
				return;
			}

			/* in any other case, show the loader */
			$el.addClass( 'tva-disabled tva-element-loading' );

			if ( $el.css( 'position' ) === 'static' ) {
				$el.css( 'position', 'relative' );
			}

			const $loader = $( ELEMENT_LOADER_TEMPLATE ).hide();

			const flexAlign = {
				'align-items': 'center',
				'justify-content': 'center',
			};
			const margin = position.includes( 'outside' ) ? `-${parseInt( size ) + 5}px` : '';
			const loaderOffset = {};

			if ( position.includes( 'top' ) ) {
				flexAlign[ 'align-items' ] = 'flex-start';
			}
			if ( position.includes( 'bottom' ) ) {
				flexAlign[ 'align-items' ] = 'flex-end';
			}
			if ( position.includes( 'left' ) ) {
				flexAlign[ 'justify-content' ] = 'flex-start';
				loaderOffset[ 'margin-left' ] = margin;
			}
			if ( position.includes( 'right' ) ) {
				flexAlign[ 'justify-content' ] = 'flex-end';
				loaderOffset[ 'margin-right' ] = margin;
			}

			$loader.css( {
				...flexAlign,
				background,
				padding,
			} );

			$loader.find( '.tvd-preloader-wrapper' ).css( {
				width: size,
				height: size,
				...loaderOffset,
			} );

			$el.append( $loader );
			$loader.fadeIn( options.fadeDuration );
		} );
	};
} )( jQuery );
