( function ( $ ) {

	const postSearch = require( './../../post-search' );

	module.exports = require( './../content-base' ).extend( {
		template: TVE_Dash.tpl( 'login-page/states/search' ),
		labels: {
			title: '',
		},
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},
		render: function () {
			this.$el.html( this.template( {
				model: this.model,
				labels: this.labels
			} ) );

			this.initPostSearch();
			this.afterRender();

			return this;
		},

		initPostSearch: function () {

			new postSearch( this.$( '#tva-search-base-page' ), {
				url: `${TVA.routes.settings}/search_pages/`,
				type: 'POST',
				renderItem: function ( ul, item ) {
					return $( `<li class="tva-selected-post">` ).append( `<span class="tva-ps-result-title">${item.label}</span><span class="tva-ps-result-email">(${item.type})</span>` ).appendTo( ul );
				},
				select: ( event, ui ) => {
					TVE_Dash.showLoader();

					this.model.set( 'value', ui.item.id );

					const xhr = this.model.save();

					if ( xhr ) {
						xhr.done( ( response, status, options ) => {
							this.model.set( 'state', 'normal' );
						} );
						xhr.always( function () {
							TVE_Dash.hideLoader();
						} );
					}
				},
			} );
		},

		createPage: function () {

			this.model.set( 'state', 'create' );
		}

	} );

} )( jQuery );
