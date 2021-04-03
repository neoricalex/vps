( function ( $ ) {

	const WPMediaView = require( './../../wp-media' );

	/**
	 * Model Form View
	 * - for adding and editing a module
	 */
	module.exports = require( './base' ).extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/forms/module' ),
		/**
		 * Initializes editor for description
		 * - renders wp media view for cover image
		 */
		afterRender: function () {
			TVA.Utils.renderMCE( 'tva-module-description', this.model, 'post_excerpt' );
			this.$( '#tva-comment-status' ).val( this.model.get( 'comment_status' ) );
			/**
			 * this one has to be called before any other inside view which has data binder
			 */
			TVE_Dash.data_binder( this );
			new WPMediaView( {
				el: this.$( '#tva-module-image' ),
				model: this.model,
				prop: 'cover_image'
			} ).render();
		}
	} );
} )( jQuery );
