( function ( $ ) {

	const base = require( '../../content-base' );
	const settingItemModel = require( './../../../models/setting-item' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/sendowl/th-page-cards' ),
		selectedClass: 'tva-selected',
		afterRender: function () {

			this.$( `[data-type=${this.model.get( 'type' )}]` ).addClass( this.selectedClass );
		},

		click: function ( e, dom ) {
			e.stopPropagation();

			if ( dom.classList.contains( this.selectedClass ) ) {
				return;
			}

			TVE_Dash.showLoader();


			this.model.set( 'type', dom.dataset.type );

			const model = new settingItemModel( {key: 'thankyou_page_type', value: dom.dataset.type} );

			if ( ! model.isValid() ) {
				TVE_Dash.err( model.validationError.message );
				return;
			}

			const xhr = model.save();

			if ( xhr ) {

				xhr
					.done( ( response, status, options ) => {
						this.$( `.${this.selectedClass}` ).removeClass( this.selectedClass );
						this.$( `[data-type=${this.model.get( 'type' )}]` ).addClass( this.selectedClass );

						TVE_Dash.success( TVA.t.SuccessfulSave, 3000, null, 'top' )
					} )
					.always( () => TVE_Dash.hideLoader() );
			}
		}
	} );

} )( jQuery );
