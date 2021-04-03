( function ( $ ) {
	/**
	 * Backbone View which is rendered as HTML input
	 */
	module.exports = require( './../base' ).extend( {
		/**
		 * @param {string}
		 */
		className: 'tva-search-elem',
		/**
		 * @param template
		 */
		template: TVE_Dash.tpl( 'search-elem' ),
		/**
		 * Events to which this view listen
		 */
		events: {
			'keyup input': _.debounce( function () {
				onChange.apply( this, arguments );
			}, 400 ),
			'click .tva-close': function ( event ) {
				const $searchElem = $( event.target ).closest( '.tva-search-elem' );

				$searchElem.find( '.tva-close' ).removeClass( 'tva-close' );
				$searchElem.find( 'input' ).val( '' ).trigger( 'keyup' );
			},
			'input #tva-search': function ( event ) {
				$( event.target ).siblings().toggleClass( 'tva-close', event.target.value.trim().length > 0 );
			}
		},
		/**
		 * Implement this to:
		 * - set type of input
		 */
		initialize: function ( options = {} ) {
			this.options = options;
		},

		/**
		 * Called after the text input has been rendered
		 */
		afterRender: function () {
			this.options.placeholder && this.$( 'input' ).attr( 'placeholder', this.options.placeholder );
		},

		/**
		 * Returns the value of the search input
		 *
		 * @returns {string}
		 */
		getValue: function () {
			return this.$( 'input' ).val();
		}
	} );

	/**
	 * Event handler for change event of this view¬/input
	 * @param {Event} event
	 */
	function onChange( event ) {
		this.trigger( 'change', event.target.value );
	}
} )( jQuery );
