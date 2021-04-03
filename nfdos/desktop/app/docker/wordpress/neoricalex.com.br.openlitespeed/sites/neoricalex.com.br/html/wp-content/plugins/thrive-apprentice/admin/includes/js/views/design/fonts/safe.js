( function ( $ ) {

	const base = require( '../../base' ),
		utils = require( '../utils' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'design/fonts/safe' ),
		fonts: [],
		selectors: [
			'body a', 'body p', 'body h1', 'body h2', 'body h3', 'body h4', 'body h5', 'body span', 'body strong'
		],
		initialize: function ( options ) {
			base.prototype.initialize.apply( this, arguments );

			this.fonts = options.fonts;

			this.render();

			const $sourceSelect = this.$( '.tva-fonts-select' );

			this.fonts.forEach( font => {

				const $option = $( '<option/>' ),
					attr = {
						value: font.family,
					};

				if ( options.selected === font.family ) {
					attr.selected = true;
				}

				$option.attr( attr ).text( font.family );

				$sourceSelect.append( $option );
			} );
		},

		/**
		 * Callback when a user changes the font
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		changeFont: function ( event, dom ) {
			this.model.get( 'template' ).font_family = dom.value;

			this.selectors.forEach( selector => {
				utils.styleIframeElements( selector, 'font-family', dom.value );
			} );
		},
		/**
		 * Removes the events from view
		 */
		removeEventsFromView: function () {
			this.undelegateEvents();
			this.$el.removeData().unbind();
		}
	} );
} )( jQuery );
