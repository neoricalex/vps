( function ( $ ) {
	/**
	 * View for a menu item
	 */
	module.exports = require( './../base' ).extend( {
		/**
		 * @param {{Backbone.Model}} of menu item
		 */
		model: null,
		/**
		 * @param {{Backbone.Collection}} of submenu items
		 */
		collection: null,
		/**
		 * @param {string}
		 */
		className: 'tva-menu-item',
		/**
		 * @param template
		 */
		template: TVE_Dash.tpl( 'menu-item' ),
		/**
		 * @param {string} for css class used for selected item
		 */
		selectedClass: 'tva-menu-item-selected',
		/**
		 * @param {String} css class used for disabled submenu item
		 */
		disabledClass: 'tva-menu-item-disabled',
		/**
		 * @param {Object}
		 */
		events: {
			'click': function ( event ) {
				let route = event.currentTarget.dataset.route;
				if ( this.model.get( 'items' ).length !== 0 ) {
					const first = this.model.get( 'items' ).first();
					route = first ? first.get( 'slug' ) : route;
				}

				route && this.changeView( route );
			}
		},
		tagName: function () {
			return this.model.has( 'href' ) ? 'a' : 'div';
		},
		/**
		 * Overwrite the parent initialize method
		 */
		initialize: function () {
			this.listenTo( this.model, 'change:selected', this.onChangeSelected );
			this.listenTo( this.model, 'change', this.render );
		},
		/**
		 * @return {{Backbone.View}}
		 */
		render: function () {
			this.$el.html( this.template( {model: this.model} ) )
			    .removeClass( `${this.disabledClass} tvd-tooltipped` )
			    .removeAttr( 'data-position data-tooltip data-route href target' );

			if ( this.model.get( 'disabled' ) ) {
				this.$el.addClass( `${this.disabledClass} tvd-tooltipped` ).attr( {
					'data-position': 'right',
					'data-tooltip': this.model.get( 'disabled' ),
				} );
			} else if ( this.model.has( 'route' ) ) {
				this.$el.attr( 'data-route', this.model.get( 'route' ) );
			} else if ( this.model.has( 'href' ) ) {
				this.$el.attr( {
					'href': this.model.get( 'href' ),
					'target': '_blank'
				} );
			}

			return this;
		},
		/**
		 * Toggles css class
		 * @param {{Backbone.Model}} model which was selected
		 * @param {boolean} isSelected if the model was set as selected or not
		 */
		onChangeSelected: function ( model, isSelected ) {
			this.$el.toggleClass( this.selectedClass, isSelected );
		}
	} );
} )( jQuery );
