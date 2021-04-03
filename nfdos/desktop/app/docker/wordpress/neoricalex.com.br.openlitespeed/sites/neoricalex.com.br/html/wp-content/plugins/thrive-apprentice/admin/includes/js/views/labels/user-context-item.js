( function ( $ ) {
	const TopicView = require( '../topics/item' );

	module.exports = TopicView.extend( {
		className: 'tva-flex tva-label-user-switch tva-align-center tva-label-row',

		/**
		 * Underscore template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'labels/user-context-item' ),

		afterInitialize( options ) {
			$.extend( this, options );
			TopicView.prototype.afterInitialize.call( this, options );
		},

		spectrumOptions() {
			return {
				containerClassName: 'tva-label-spectrum',
			};
		},

		afterRender() {
			TVE_Dash.materialize( this.$el );

			this.$( 'select' ).data( 'select2' ).$dropdown.addClass( 'tva-context-dropdown' );
		},

		/**
		 * Toggle the loading state
		 */
		toggleLoader() {
			this.$el.tvaToggleLoader( 20, !! this.model.get( 'loading' ), {background: '', position: 'right', padding: '0 20px 0 0'} );
		},

		labelDisplayChanged( event ) {
			this.model.persist( {opt: event.currentTarget.value}, {showSuccess: false} );
		}
	} );
} )( jQuery );
