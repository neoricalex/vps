( function ( $ ) {

	const MenuItemView = require( './menu-item' );
	const SubmenuView = require( './submenu' );

	/**
	 * View for Main Menu
	 */
	module.exports = require( '../base' ).extend( {
		/**
		 * @param {{Backbone.Collection}} with menu items
		 */
		collection: null,
		/**
		 * @param {string}
		 */
		className: 'tva-menu',
		/**
		 * @param {{Backbone.View}}
		 */
		submenuView: null,

		afterInitialize: function () {
			this.listenTo( TVA.indexPageModel, 'sync', ( model ) => {
				const homepageItemModel = this.collection.findWhere( {slug: 'course-homepage'} );

				homepageItemModel.set( {
					'href': model.get( 'preview_url' ),
					'disabled': model.get( 'preview_url' ).length === 0 ? 'You need to have defined a course page' : 0
				} );
			} );
		},

		/**
		 * @return {{Backbone.View}}
		 */
		render: function () {

			this.$body = $( 'body' );
			this.$el.html( TVE_Dash.tpl( 'logo' ) );
			this.collection.each( this.renderMenuItem, this );

			this.submenuView = new SubmenuView( {
				collection: new Backbone.Collection(),
			} );

			return this;
		},
		/**
		 * Instantiate a menu item view and append it to current $el
		 * @param {{Backbone.Model}} item
		 */
		renderMenuItem: function ( item ) {
			if ( item.get( 'hidden' ) ) {
				return;
			}

			const menuItem = new MenuItemView( {model: item} );
			this.$el.append( menuItem.render().$el );
		},
	} );
} )( jQuery );
