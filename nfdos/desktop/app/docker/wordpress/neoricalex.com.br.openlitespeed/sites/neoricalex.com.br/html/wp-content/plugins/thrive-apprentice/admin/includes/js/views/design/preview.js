( function ( $ ) {

	const base = require( '../base' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'design/preview' ),
		initialize: function ( options ) {
			base.prototype.initialize.apply( this, arguments );

			this.render();
		},
		render: function () {
			let previewUrl = ( this.getPreviewBaseUrl() ).replace( /^https?\:/i, '' );

			previewUrl += previewUrl.indexOf( '?' ) === - 1 ? '?' : '&';
			previewUrl += `tpl=${this.model.get( 'template' ).ID}&`;
			previewUrl += this.model.get( 'advanced' ) ? 'tva_advanced=1&' : '';

			this.$el.html( this.template( {url: previewUrl} ) );

			return this;
		},
		/**
		 * Returns the Preview Base URL
		 *
		 * @returns {string}
		 */
		getPreviewBaseUrl: function () {
			const fragment = Backbone.history.getFragment();

			if ( fragment === 'design/index' ) {
				return TVA.indexPageModel.get( 'preview_url' );
			}

			return TVA.Utils.getPreviewUrl();
		}
	} );
} )( jQuery );
