( function ( $ ) {

	const BaseView = require( './../../base' );

	/**
	 * Base Form View for Course Items
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {

		render: function () {
			BaseView.prototype.render.apply( this, arguments );
			if ( this.model.get( 'id' ) ) {
				this.$( 'h3.tvd-modal-title' ).text( `Edit ${this.model.getType()}` );
			}

			this.$( 'select' ).select2();

			return this;
		}
	} );
} )( jQuery );
