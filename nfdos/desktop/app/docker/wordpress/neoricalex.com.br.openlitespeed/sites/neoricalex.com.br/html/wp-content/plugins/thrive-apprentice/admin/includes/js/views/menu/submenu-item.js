( function ( $ ) {
	/**
	 * View for Submenu Item
	 */
	module.exports = require( './../base' ).extend( {
		/**
		 * @param {string}
		 */
		className: 'tva-submenu-item',
		tagName: 'span',
		/**
		 * @param template
		 */
		template: TVE_Dash.tpl( 'submenu-item' ),
		/**
		 * @param {string} for css class used for selected item
		 */
		selectedClass: 'tva-submenu-item-selected',
		/**
		 * @param {Object}
		 */
		events: {
			'click': function ( event ) {
				const route = event.currentTarget.dataset.route;
				TVA.Router.navigate( route, {trigger: true} );
			}
		},
		/**
		 * Overwrite the parent initialize
		 */
		initialize: function () {
			this.model.off( 'change:selected' ).on( 'change:selected', _.bind( this.onChangeSelected, this ) );
		},
		/**
		 * @return {{Backbone.Model}}
		 */
		render: function () {
			this.$el.html( this.template( {model: this.model} ) );

			if ( this.model.get( 'disabled' ) ) {
				this.$el.hide();
			} else if ( this.model.get( 'route' ) ) {
				this.$el.attr( 'data-route', this.model.get( 'route' ) );
			} else if ( this.model.get( 'href' ) ) {
				this.$el.attr( 'onmousedown', `window.open('${this.model.get( 'href' )}')` );
			}

			if ( true === this.model.get( 'selected' ) ) {
				this.$el.addClass( this.selectedClass );
			}

			return this;
		},
		/**
		 * Toggles selected css class on current view element
		 * @param {{Backbone.Model}} model for submenu item
		 * @param {boolean} isSelected current model
		 */
		onChangeSelected: function ( model, isSelected ) {
			this.$el.toggleClass( this.selectedClass, isSelected );
		}
	} )
} )( jQuery );
