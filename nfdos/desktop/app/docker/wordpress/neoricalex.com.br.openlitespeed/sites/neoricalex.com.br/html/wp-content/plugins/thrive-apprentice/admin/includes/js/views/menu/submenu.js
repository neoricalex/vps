( function ( $ ) {

	const SubmenuItemView = require( './submenu-item' );

	/**
	 * View for Submenu
	 */
	module.exports = require( '../base' ).extend( {
		/**
		 * @property {Backbone.Model}
		 */
		menuItem: null,
		/**
		 * @param {string}
		 */
		className: 'tva-submenu',
		/**
		 * @property {string} for css class name
		 */
		titleClassName: 'tva-submenu-title',
		/**
		 * Setup any needed listeners
		 */
		afterInitialize() {
			this.listenTo( this.collection, 'reset', this.render );
		},
		/**
		 * @return {{Backbone.View}}
		 */
		render: function () {

			//empty submenu and append a title
			this.$el
			    .empty()
			    .append( $( `<div class="${this.titleClassName}">${this.menuItem.get( 'label' )}</div>` ) );

			//render sections
			if ( this.menuItem instanceof Backbone.Model && this.menuItem.get( 'sections' ) instanceof Backbone.Collection ) {
				this.menuItem.get( 'sections' ).each( ( model ) => {
					this.$el.append( this.renderSection( model ) );
				} );
			}

			let $list = $();
			this.collection.each( ( item ) => {
				const $item = this.renderItem( item );
				if ( item.get( 'section' ) ) { //render submenu item in its section
					return this.$( `.tva-submenu-section[data-slug="${item.get( 'section' )}"]` ).append( $item );
				}
				$list = $list.add( $item );
			} );

			/**
			 * only perform DOM manipulations after loop
			 */
			this.$el.toggle( !! $list.length );

			this.$( '.tva-submenu-title' ).after( $list );

			this.$( '.tva-submenu-section-title' ).on( 'click', ( event ) => {
				const $parent = $( event.currentTarget ).parent();
				$parent.toggleClass( 'tva-collapsed' );
				this.menuItem.get( 'sections' ).findWhere( {slug: $parent.data( 'slug' )} ).set( 'expanded', ! $parent.hasClass( 'tva-collapsed' ) );
			} );

			return this;
		},
		/**
		 * Renders submenu item model
		 *
		 * @param {Backbone.Model} model
		 *
		 * @return {jQuery}
		 */
		renderItem: function ( model ) {
			return new SubmenuItemView( {
				model
			} ).render().$el;
		},
		/**
		 * Renders a section model and returns its $el
		 * @param {Backbone.Model} sectionModel
		 * @return {jQuery}
		 */
		renderSection: function ( sectionModel ) {
			return $( `<div class="tva-submenu-section ${! sectionModel.get( 'expanded' ) ? 'tva-collapsed' : ''}" data-slug="${sectionModel.get( 'slug' )}"><div class="tva-submenu-section-title">${sectionModel.get( 'label' )}</div></div>` )
		}
	} );
} )( jQuery );
