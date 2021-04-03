( function ( $ ) {

	module.exports = require( './../content-base' ).extend( {
		labels: {
			title: '',
		},
		template: TVE_Dash.tpl( 'login-page/states/delete' ),
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},
		render: function () {
			this.$el.html( this.template( {
				model: this.model,
				labels: this.labels
			} ) );

			this.afterRender();

			return this;
		},

		confirmRemove: function () {

			TVE_Dash.showLoader();

			/**
			 * Reset the model with it's defaults
			 */
			this.model.set( this.model.defaults() );

			const xhr = this.model.save();

			if ( xhr ) {
				xhr.done( ( response, status, options ) => {
					this.model.set( {...this.model.defaults(), state: 'search'} );
				} );
				xhr.always( function () {
					TVE_Dash.hideLoader();
				} );
			}
		},

		cancelRemove: function () {

			this.model.set( 'state', 'normal' );
		}
	} );

} )( jQuery );
