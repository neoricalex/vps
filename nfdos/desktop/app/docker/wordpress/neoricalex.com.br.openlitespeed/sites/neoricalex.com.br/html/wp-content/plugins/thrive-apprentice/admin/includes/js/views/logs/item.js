( function ( $ ) {
	const base = require( '../base' );

	const LeftColumn = base.extend( {
		tagName: 'li',
		className: 'tvd-collection-header tva-logs-small',
		initialize: function ( options ) {
			this.value = options.value;

			this.$( '.tvd-collection-item' ).hide();
		},
		render: function () {
			this.$el.html( `<div class="tve-debug-item"><h5>${this.value || this.value === 0 ? this.value : '---'}</h5></div>` );

			return this;
		}
	} );

	const RightColumn = LeftColumn.extend( {
		className: 'tvd-collection-item tve-debug-column tva-logs-big'
	} );

	const RightTableColumn = base.extend( {
		tagName: 'li',
		className: 'tvd-collection-item tve-debug-column tve-debug-sub-table tva-logs-big',
		render: function () {
			this.renderData();

			return this;
		},
		renderData: function () {
			this.$el.append( ( new Data( {
				model: this.model
			} ) ).render().$el );
		}
	} );

	const InfoRow = base.extend( {
		tagName: 'li',
		className: 'tvd-collection-header ttw-table-header',
		template: TVE_Dash.tpl( 'settings/log-info-item' ),
	} );

	const Data = base.extend( {
		tagName: 'ul',
		className: 'tvd-collection tvd-with-header tva-logs',
		events: {
			'click .ttw-table-header': 'toggleLog'
		},
		toggleLog: function ( event ) {
			const $target = $( event.currentTarget );

			this.$( '.tvd-collection-item, .tvd-collection-header' ).not( '.ttw-table-header' ).toggle();

			$target.find( '.tve-debug-slide > span' ).toggleClass( "tve-churn-icon-keyboard_arrow_up" );
			$target.find( '.tve-debug-slide > span' ).toggleClass( "tve-churn-icon-keyboard_arrow_down" );

			return false;
		},
		render: function () {
			const data = this.model.get( 'data' );

			if ( this.model.get( 'type' ) && this.model.get( 'identifier' ) ) {
				this.renderInfo();
			}

			if ( typeof data === 'object' ) {
				_.each( data, ( value, attribute ) => {

					this.$el.append( ( new LeftColumn( {
						value: attribute
					} ) ).render().$el );

					const _instance = ( typeof value === 'object' && value !== null ) ? new RightTableColumn( {model: new Backbone.Model( {data: value} )} ) : new RightColumn( {value: value} );

					this.$el.append( _instance.render().$el );
				} );
			}

			return this;
		},
		renderInfo: function () {
			this.$el.append( ( new InfoRow( {
				model: this.model
			} ) ).render().$el );
		}
	} );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/log-item' ),
		afterRender: function () {
			this.$( '.tve-debug-table' ).append( ( new Data( {
				model: this.model
			} ) ).render().$el );
		}
	} );
} )( jQuery );
