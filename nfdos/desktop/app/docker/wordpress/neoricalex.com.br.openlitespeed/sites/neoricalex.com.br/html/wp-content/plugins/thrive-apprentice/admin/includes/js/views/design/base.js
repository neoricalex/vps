( function ( $ ) {
	const utils = require( './utils' ),
		base = require( '../base' ),
		templateSettingModel = require( '../../models/setting-item' );

	module.exports = base.extend( {
		events: function () {
			return _.extend( base.prototype.events, {
				'click .tva-settings-card-title': 'toggleSettingsCard',
			} );
		},
		initialize: function ( options ) {
			base.prototype.initialize.apply( this, arguments );

			this.render();

			TVE_Dash.materialize( this.$el );
		},
		/**
		 * Changes the model template data
		 *
		 * @param {String} index
		 * @param {String|Number} value
		 */
		changeModelTemplateValue: function ( index, value ) {
			this.model.get( 'template' )[ index ] = value;
		},

		/**
		 * Trigger when the user drags the slider
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		sliderInput: function ( event, dom ) {
			const $dom = $( dom ),
				name = dom.getAttribute( 'name' ),
				prop = dom.getAttribute( 'data-css-prop' ),
				type = dom.getAttribute( 'type' ),
				value = `${dom.value}px`;

			let $card = $dom.closest( '.tva-card' );

			if ( $card.length === 0 ) {
				$card = $dom.closest( '.tva-sidebar-wrapper' );
			}

			$card.find( type === 'range' ? `#tva_${name}_input` : `#tva_${name}` ).val( dom.value );

			utils.styleIframeElements( `.tva_${name}`, prop, value );

			this.changeModelTemplateValue( name, parseInt( value ) );
		},

		/**
		 * Triggered when the user checks a checkbox
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		checkboxInput: function ( event, dom ) {
			const name = dom.getAttribute( 'name' );

			this.changeModelTemplateValue( name, Number( dom.checked ) );

			utils.collapse( this.model.get( 'template' ) );
		},

		/**
		 * Changes text in the iframe and updates the model
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeText: function ( event, dom ) {
			const index = dom.getAttribute( 'name' );

			utils.changeText( `.tva_${index}`, dom.value );

			this.changeModelTemplateValue( index, dom.value );
		},

		/**
		 * Changes the attribute of an element in the iframe and updates the model
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeAttribute: function ( event, dom ) {
			const index = dom.getAttribute( 'name' ),
				attribute = dom.getAttribute( 'data-attr-name' );

			utils.changeAttr( `.tva_${index}`, attribute, dom.value );

			this.changeModelTemplateValue( index, dom.value );
		},

		/**
		 * Modify settings view
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 */
		modifySettingsView: function ( event, dom ) {
			this.save().always( () => {
				this.changeView( `#${dom.getAttribute( 'data-state' )}` );
			} );
		},

		/**
		 * Toggle the settings cards (open / closed)
		 *
		 * @param {Event} event
		 *
		 * @returns {boolean}
		 */
		toggleSettingsCard: function ( event ) {
			$( event.currentTarget ).closest( '.tva-settings-card' )
			                        .siblings().removeClass( 'open' )
			                        .end()
			                        .toggleClass( 'open' );

			return false;
		},

		/**
		 * Triggered when the user clicks save
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 *
		 * @returns {Object} XHR object
		 */
		save: function ( event, dom ) {
			TVE_Dash.showLoader();

			return ( new templateSettingModel( {key: 'template', value: this.model.get( 'template' )} ) ).save().success( () => {
				event && TVE_Dash.hideLoader();
			} ).error( () => {
				TVE_Dash.hideLoader();
			} );
		}
	} );
} )( jQuery );
