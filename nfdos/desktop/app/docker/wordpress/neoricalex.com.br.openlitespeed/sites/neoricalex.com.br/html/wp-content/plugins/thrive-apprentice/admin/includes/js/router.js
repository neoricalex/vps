( function ( $ ) {

	const ContentBaseView = require( './views/content-base' );
	const MenuView = require( './views/menu/menu' );
	const SubmenuView = require( './views/menu/submenu' );
	const MenuItemsCollection = require( './collections/menu-items' );

	/**
	 * Router
	 * - Based on defined routes renders a specific content
	 */
	module.exports = Backbone.Router.extend( {
		/**
		 * Main APP Element
		 */
		$el: $( '#tva-app' ),

		/**
		 * Body jq reference
		 */
		$body: $( 'body' ),

		/**
		 * Content Element
		 */
		$content: $( '#tva-content' ),
		/**
		 * @param {{Backbone.View}}
		 */
		contentView: null,
		/**
		 * @param {{Backbone.Collection}}
		 */
		menuItems: null,
		/**
		 * @property {Backbone.Collection}
		 */
		submenuItems: null,
		/**
		 * @property {Backbone.View}
		 */
		submenuView: null,
		/**
		 * Routes
		 * @param {Object}
		 */
		routes: {
			'courses(/:submenu)(/:sub_option)': 'renderView',
			'customers(/:submenu)': 'renderView',
			'settings(/:submenu)(/:sub_option)': 'renderView',
			'wizard': 'renderView',
			'design(/:submenu)': 'renderView',
		},
		/**
		 * First folder in route after #
		 * e.g.: #courses/
		 * @property {string}
		 */
		menu: null,
		/**
		 * Second folder in route after #
		 * e.g.: #courses/id
		 * @property {string}
		 */
		submenu: null,
		/**
		 * Initialize
		 */
		initialize: function () {
			this.menuItems = new MenuItemsCollection( Object.values( TVA.menuItems ) );
			this.submenuItems = new Backbone.Collection();

			new MenuView( {
				el: this.$el.find( '.tva-menu' )[ 0 ],
				collection: this.menuItems,
			} ).render();

			this.submenuView = new SubmenuView( {
				el: this.$el.find( '.tva-submenu' )[ 0 ],
				collection: this.submenuItems,
			} );
		},
		/**
		 * Based on current route try to render a view for content
		 * @param {string} submenu
		 * @param {string} sub_option
		 */
		renderView: function ( submenu, sub_option ) {

			const slugs = Backbone.history.getFragment().split( '/' );
			this.menu = slugs[ 0 ];

			/**
			 * Add dynamically a class on body that shows the active tab
			 */
			this.$body.removeClass( ( index, className ) => {
				return ( className.match( /(^|\s)tva-active-tab-\S+/g ) || [] ).join( ' ' );
			} ).addClass( `tva-active-tab-${this.menu}` );

			this.menuItems.each( ( menuItem ) => menuItem.set( 'selected', menuItem.get( 'slug' ) === this.menu ) );

			const menuItem = this.menuItems.findWhere( {selected: true} );

			if ( ! menuItem ) {
				/**
				 * Handles the case when no submenu is found in the collection
				 * Use case: when a wrong or non-existent slug is entered after # in the URL
				 */
				return;
			}

			this.submenuView.menuItem = menuItem;

			/**
			 * Reset the submenu item collection => this will re-render the submenu
			 */
			this.submenuItems.reset( menuItem.get( 'items' ).models );

			if ( menuItem.get( 'items' ).length === 0 ) {
				return this.loadContent( this.menu );
			}

			this.submenu = submenu || this.menu;

			menuItem.get( 'items' ).each( submenuItem => submenuItem.set( 'selected', submenuItem.get( 'slug' ) === this.submenu ) );

			this.loadContent( this.submenu, sub_option );
		},
		/**
		 * Based on menu route render a specific content
		 * @param {string} menu
		 * @param {string} [subOption]
		 */
		loadContent: function ( menu, subOption = '' ) {

			this.contentView = this.factoryView( menu, subOption );

			if ( this.contentView instanceof ContentBaseView ) {
				this.$content.html( this.contentView.render().$el );
			}
		},
		/**
		 *
		 * @param {String} menu
		 * @param {String} [subOption]
		 * @return {{Backbone.View}}
		 */
		factoryView: function ( menu, subOption = '' ) {

			let view;
			let id = parseInt( menu );

			try {
				view = isNaN( id ) ? require( `./views/${menu}${subOption ? '/' + subOption : ''}` ) : ( ( ( menu, submenu ) => {
					switch ( this.menu ) {
						case 'courses':
							return require( './views/course/form' );
						default:
							return require( './views/content-base' );
					}
				} )() );
			} catch ( e ) {
				console.log( e );
				console.error( menu + ' view is not yet implemented. Please do so !' );
				view = require( './views/content-base' );
			}

			this.currentView && this.currentView.destroy();

			this.currentView = new view( {
				id: parseInt( menu )
			} );

			return this.currentView;
		}
	} );
} )( jQuery );
