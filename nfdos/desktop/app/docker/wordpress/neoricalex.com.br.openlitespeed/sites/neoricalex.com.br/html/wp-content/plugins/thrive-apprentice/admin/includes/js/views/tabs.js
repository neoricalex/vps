( function ( $ ) {
	module.exports = require( './base' ).extend( {
		/**
		 * @property {jQuery}
		 */
		$tabs: null,
		/**
		 * @property {string} css class for current view $element
		 */
		className: 'tva-tabs',
		/**
		 * @property {number} of tab index which should be displayed by default
		 */
		selectedIndex: 0,
		/**
		 * @property {Array} of content views provided at instantiation
		 */
		contentViews: [],
		/**
		 * @property {string} css class for current selected tab
		 */
		selectedTabCssClass: 'tva-tab-selected',
		/**
		 * @property {string} css class for tabs ul
		 */
		tabUlClass: 'tva-tabs-ul',
		/**
		 * @property {string} css class for current selected content
		 */
		selectedContentCssClass: 'tva-tab-content-selected',
		/**
		 * @property {Object} Events
		 */
		events: {
			'click li': function ( event ) {

				const index = parseInt( $( event.currentTarget ).data( 'index' ) );
				this.selectTab( index );
			}
		},
		/**
		 * Resets the views stack
		 * @param {Object} options
		 */
		initialize: function ( options ) {

			$.extend( true, this, options );

			this.contentViews = [];
		},
		/**
		 * Update tab labels
		 */
		updateNames() {
			const $labels = this.$tabs.find( '.tva-tab-title' );
			this.collection.each( ( model, index ) => {
				if ( $labels[ index ] ) {
					$labels[ index ].textContent = model.get( 'name' );
				}
			} );
		},
		/**
		 * Puts some html in $el
		 * @return {Backbone.View}
		 */
		render: function () {

			this.$tabs = $( '<ul/>' );
			this.$tabs.addClass( this.tabUlClass );
			this.$el.append( this.$tabs );

			this.collection.each( ( model, index ) => {

				const $li = $( '<li>' )
					.html( `<span class="tva-tab-icon">${TVA.Utils.icon( model.get( 'icon' ) )}</span><span class="tva-tab-title">${model.get( 'name' )}</span>` )
					.data( 'index', index );

				this.$tabs.append( $li );

				const contentView = model.get( 'view' );
				this.contentViews.push( contentView );
				this.$tabs.after( contentView.render().$el.hide() );
			} );

			this.selectTab( this.selectedIndex );

			this.addChild( this.contentViews );

			return this;
		},
		/**
		 * Select a specific tab and shows it's content
		 * @param {number|string} index
		 */
		selectTab: function ( index ) {

			if ( index !== 0 && ! this.course.get( 'id' ) ) {
				index = 0;
				typeof TVE_Dash.warning === 'function' ?
					TVE_Dash.warning( TVA.t.saveCourseBefore )
					: TVE_Dash.err( TVA.t.saveCourseBefore )
			}

			index = parseInt( index );

			if ( isNaN( index ) ) {

				index = 0;
			}

			if ( index > this.contentViews.length ) {
				throw new Error( 'there are not so many tabs to select index: ' + index );
			}

			this.selectedIndex = index;

			this.$tabs.find( 'li' ).removeClass( this.selectedTabCssClass );
			this.$tabs.find( 'li' ).eq( this.selectedIndex ).addClass( this.selectedTabCssClass );

			this.contentViews.forEach( ( view, i ) => {

				const _showHideMethod = i === this.selectedIndex ? 'show' : 'hide';
				view.$el[ _showHideMethod ]();

				const _addRemoveMethod = i === this.selectedIndex ? 'addClass' : 'removeClass';
				view.$el[ _addRemoveMethod ]( this.selectedContentCssClass );

				if ( i === this.selectedIndex ) {
					view.bindZclip();
				}
			} );

			this.trigger( 'tab.selected.index', this.selectedIndex );
		},
		/**
		 * Returns the Selected Tab
		 *
		 * @returns {jQuery}
		 */
		getSelected: function () {
			return this.$tabs.find( `li.${this.selectedTabCssClass}` );
		},
		/**
		 * Changes the tab icon
		 *
		 * @param {jQuery} $li
		 * @param {String} icon
		 */
		changeIcon: function ( $li, icon ) {
			$li.find( '.tva-tab-icon' ).html( icon );
		}
	} );
} )( jQuery );
