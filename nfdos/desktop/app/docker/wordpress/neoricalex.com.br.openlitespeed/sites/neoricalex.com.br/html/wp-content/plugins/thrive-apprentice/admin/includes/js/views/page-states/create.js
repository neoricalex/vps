( function ( $ ) {

	module.exports = require( './../content-base' ).extend( {
		template: TVE_Dash.tpl( 'login-page/states/create' ),
		afterInitialize: function ( options ) {
			$.extend( true, this, options );
		},

		render: function () {

			this.$el.html( this.template( {
				model: this.model,
				labels: this.labels,
			} ) );

			this.afterRender();

			return this;
		},

		onCancel: function () {

			this.model.set( 'state', 'search' );
		},

		onSave: function () {

			this.tvaClearError();

			if ( ! this.model.isValid() ) {
				return this.tvaShowErrors( this.model );
			}

			TVE_Dash.showLoader();

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

		/**
		 * Triggered when user inputs the text field
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		onInput: function ( event, dom ) {

			this.model.set( dom.getAttribute( 'data-field' ), dom.value );
		}
	} );

} )( jQuery );
