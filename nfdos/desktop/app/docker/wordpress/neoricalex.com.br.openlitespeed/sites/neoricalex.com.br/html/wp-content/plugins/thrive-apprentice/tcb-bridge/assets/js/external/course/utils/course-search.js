( function ( $ ) {
	module.exports = TVE.Views.InlinePanel.extend( {
		template: TVE.tpl( 'inline/content-templates' ),
		after_initialize: function () {
			this.$( '.drop-panel' ).addClass( 'small-pad tcb-autocomplete' );
			this.autocomplete();
		},
		autocomplete: function () {
			const autocompleteSource = Object.values( TVA.courses ).reverse();

			/**
			 * Alter the data so it will work with jQuery.ui.autocomplete.filter function
			 */
			autocompleteSource.forEach( ( currentValue, index ) => {
				autocompleteSource[ index ].label = currentValue.name;
			} );

			this.$input = this.$( '.tcb-search' ).autocomplete( {
				minLength: 0,
				source: function ( request, response ) {
					const results = $.ui.autocomplete.filter( autocompleteSource, request.term );

					response( results );
				},
				appendTo: this.$( '.popup-content' ),
				select: ( e, ui ) => {
					TVE.main.trigger( 'insert-course', ui.item.id );
					e.stopPropagation();

					return false;
				},
				open: ( event, ui ) => {
					this.$( '.ui-menu-item-wrapper' ).removeClass( 'ui-menu-item-wrapper ui-state-active' );
				}
			} );

			this.$input.data( 'ui-autocomplete' )._renderItem = function ( ul, item ) {
				ul.addClass( 'tcb-suggest' );
				const r = new RegExp( this.term, 'i' ),
					li = $( '<li></li>' ).data( 'item.autocomplete', item )
					                     .append( `<a href="#" class="tcb-truncate">${item.name.replace( r, `<span class="highlight">${this.term}</span>` )}</a>` )
					                     .appendTo( ul );
				return li;
			};
		},
		/**
		 * Hides the DropPanel.
		 *
		 * Calls the InlinePanel Hide function with custom parameters
		 */
		hide: function () {
			TVE.Views.InlinePanel.prototype.hide.call( this, this.$element, null );
		},
		onOpen: function () {
			this.$input.val( '' ).autocomplete( 'search' );

			this.$input[ 0 ].focus();
		}
	} );
} )( jQuery );
