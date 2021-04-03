( function ( $ ) {
	/**
	 * Underscore template for rendering a svg icon (font-awesome svg)
	 *
	 * @type {string}
	 */
	const svgIconTemplate = `<span class="tva-icon-item tva-svg-icon click" data-fn="select" data-cls="<#=id#>"><svg class="tva-icon tva-<#= id #>"><use xlink:href="#<#= id #>"></use></svg></span>`;

	/**
	 * Underscore template for rendering a custom saved icon (Icomoon icon)
	 *
	 * @type {string}
	 */
	const customIconTemplate = `<span class="tva-icon-item tva-custom-icon click" data-fn="select" title="<#= title #>" data-cls="<#=icon#>"><span class="<#= icon #>"></span></span>`;

	/**
	 * Modal that contains a list of selectable icons, FontAwesome and IcoMoon sets
	 */
	const IconsModal = require( './base' ).extend( {
		/**
		 * Underscore template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'modals/icons' ),

		/**
		 * CSS class to be applied to selected icons
		 *
		 * @type {String}
		 */
		selectedClass: 'tva-selected',

		/**
		 * Offset for infinite loading
		 *
		 * @type {Number}
		 */
		offset: 0,

		/**
		 * Page size for infinite loading
		 *
		 * @type {Number}
		 */
		count: 200,

		/**
		 * Load icons, build the list of icons and render them
		 */
		afterRender: function () {
			this.showLoader();
			this.$container = this.$( '.tva-icons-list' );

			this.$customList = this.$( '.tva-custom-icons-list' );
			this.$svgList = this.$( '.tva-font-awesome-icons' );
			this.$dimension = this.$( '.tva-icons-height' );

			this.$titles = this.$( '.tva-custom-icons-title,.tva-svg-icons-title' ).hide();

			const containerHeight = this.$container.height();

			/**
			 * Figure out initial count - based on the available space
			 *
			 * 15 icons / row, each row has a height of 40 + 10 (gutter)
			 */
			this.count = Math.max( 200, 15 * Math.round( containerHeight / 50 ) );

			IconsModal.loadIcons().then( () => {
				this.renderIcons();
				/* on scroll, load the next bunch of icons if scrollTop is close enough to the end */
				this.$container.scroll( () => {
					this.iconsContainerHeight = this.$dimension.outerHeight();
					if ( this.$container.scrollTop() + containerHeight > this.iconsContainerHeight - 50 ) {
						this.offset += this.count;
						this.renderIcons();
						this.iconsContainerHeight = this.$dimension.outerHeight();
					}
				} );

				requestAnimationFrame( () => this.hideLoader() );
			} );
		},
		/**
		 * Renders the list of custom + svg icons
		 *
		 * @param {Array} icons
		 */
		renderIcons( icons = IconsModal.icons ) {
			const html = {
				custom: '',
				svg: '',
			};

			icons.slice( this.offset, this.offset + this.count ).forEach( icon => {
				html[ icon.type ] += icon.html;
			} );

			/* for zero offset => reset lists, set entire html content */
			const renderFn = this.offset === 0 ? 'html' : 'append';
			if ( this.offset === 0 ) {
				this.containerScroll = 0;
			}

			this.$titles.filter( '.tva-custom-icons-title' ).toggle( !! html.custom.length );
			this.$titles.filter( '.tva-svg-icons-title' ).toggle( !! html.svg.length );

			this.$customList[ renderFn ]( html.custom );
			this.$svgList[ renderFn ]( html.svg );
		},

		/**
		 * Filter the array of icons based on `title` field (case insensitive)
		 *
		 * @param {jQuery.Event} event
		 */
		search: function ( event ) {
			clearTimeout( this.searchTimeout );
			/* use a 100ms typing debounce */
			this.searchTimeout = setTimeout( () => {
				const keywords = event.currentTarget.value.toLowerCase().trim();
				this.offset = 0;
				this.renderIcons( IconsModal.icons.filter( icon => {
					return ! keywords || icon.title.includes( keywords );
				} ) );
			}, 100 );
		},

		/**
		 * Select an icon on click
		 *
		 * @param {jQuery.Event} e
		 */
		select: function ( e ) {
			this.$( '.tva-icon-item' ).removeClass( this.selectedClass );
			e.currentTarget.classList.add( this.selectedClass );
			this.$( '.tvd-modal-submit' ).removeClass( 'tva-disabled' );

			this.selectedIcon = e.currentTarget;

			return false;
		},

		/**
		 * Saves the currently selected icon and closes the modal
		 *
		 * @return {boolean}
		 */
		save() {
			const icon = this.selectedIcon;
			let html = '';

			if ( icon.classList.contains( 'tva-custom-icon' ) ) {
				html = `<div class="tva-icon-item tva-custom-icon"><span class="${icon.dataset.cls}"></span></div>`;
			} else {
				const symbol = document.querySelector( `symbol#${icon.dataset.cls}` );
				html = `<svg class="tva-icon" viewBox="${symbol.getAttribute( 'viewBox' )}" data-id="${symbol.id}" data-name="${symbol.textContent}">${symbol.innerHTML}</svg>`;
			}

			this.model.persist( {
				icon_type: 'svg_icon',
				svg_icon: html,
			} );

			this.close();

			return false;
		},
	}, {
		/**
		 * Static function that loads icons from server.
		 *
		 * @return {Promise} The returned promise is always resolved with an array of icons
		 */
		loadIcons() {
			return new Promise( resolve => {
				if ( IconsModal.icons ) {
					return resolve( IconsModal.icons );
				}

				/* load them via ajax */
				wp.apiRequest( {
					url: TVA.routes.topics + '/get_fontawesome_icons',
					type: 'GET'
				} ).done( function ( response ) {
					const $svgIcons = $( response.tcb_icons );
					let icons = [];

					/* custom icons */
					if ( response.custom_icons && Array.isArray( response.custom_icons.icons ) ) {
						response.custom_icons.icons.forEach( icon => {
							const title = icon.replace( 'icon-', '' );
							icons.push( {
								type: 'custom',
								title,
								html: _.template( customIconTemplate, TVE_Dash.templateSettings )( {icon, title} ),
							} );
						} );
					}

					/* svg icons */
					$svgIcons.find( 'symbol' ).each( ( index, symbol ) => {
						const title = symbol.id.replace( 'icon-', '' );
						icons.push( {
							type: 'svg',
							title,
							html: _.template( svgIconTemplate, TVE_Dash.templateSettings )( {id: symbol.id} )
						} );
					} );

					IconsModal.icons = icons;
					$( 'body' ).append( $svgIcons.hide() );

					resolve( IconsModal.icons );
				} );
			} );
		}
	} );

	module.exports = IconsModal;
} )( jQuery );
