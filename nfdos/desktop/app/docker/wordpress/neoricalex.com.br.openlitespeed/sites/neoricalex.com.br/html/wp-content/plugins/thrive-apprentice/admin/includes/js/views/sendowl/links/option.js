( function ( $ ) {

	const base = require( '../../base' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/sendowl/links-option' ),
		items: [],
		className: 'tva-card tva-purchase-card',
		buttonLabel: 'Button',
		disabledClass: 'tva-so-option-disabled',
		queryStringName: '',
		afterInitialize: function ( attr ) {
			this.option = attr.option;
			this.queryStringName = attr.queryStringName;

			if ( this.hasData() ) {
				this.items = TVA.sendowl[ this.option ];
			}

			this.buttonLabel = attr.button_label || this.buttonLabel;
		},
		/**
		 * Checks if the card has option data
		 *
		 * @return {boolean}
		 */
		hasData: function () {
			return TVA.sendowl[ this.option ] && Array.isArray( TVA.sendowl[ this.option ] ) && TVA.sendowl[ this.option ].length > 0;
		},
		/**
		 * After render function
		 */
		afterRender: function () {
			this.$select = this.$( 'select' ).empty().append( `<option value="">Select an option</option>` );
			this.$button = this.$( 'button' );

			if ( this.hasData() ) {
				this.items.forEach( item => {
					const $option = $( '<option/>' )
						.val( this.option === 'discounts' ? item.code : item.id )
						.text( item.name );

					this.$select.append( $option );
				} );
			} else {
				this.$select.hide();
				this.$select.after( TVE_Dash.tpl( `settings/sendowl/no-${this.option}` )() );
			}

			this.$button.html( this.buttonLabel );
		},
		/**
		 * Enables / Disabled the Card
		 *
		 * @param {Boolean} state
		 */
		toggleDisabled: function ( state ) {
			this.$el.toggleClass( this.disabledClass, state );
		},
		/**
		 * Shows / Hides the Opton card
		 *
		 * @param {boolean} state
		 */
		toggle: function ( state ) {
			this.$el.toggle( state );
		},
		/**
		 * Refresh SendOwl data depending on the option
		 *
		 * @param {Event} event
		 * @param {HTMLButtonElement} dom
		 */
		refreshData: function ( event, dom ) {
			TVE_Dash.showLoader();
			dom.setAttribute( 'disabled', 'disabled' );

			$.ajax( {
				url: `${TVA.routes.sendowl}/refresh_data`,
				type: 'POST',
				data: {
					option: this.option,
				},
				beforeSend: function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
				}
			} ).success( response => {
				if ( response.items && Array.isArray( response.items ) ) {
					this.items = TVA.sendowl[ this.option ] = response.items;
					this.render();
					this.refreshDataCallback();
				}
			} ).error( response => {
				TVE_Dash.err( response.responseJSON.message );
			} ).complete( response => {
				TVE_Dash.hideLoader();
				dom.removeAttribute( 'disabled' );
			} );
		},
		refreshDataCallback: $.noop,
		selectChange: $.noop,
	} );
} )( jQuery );
