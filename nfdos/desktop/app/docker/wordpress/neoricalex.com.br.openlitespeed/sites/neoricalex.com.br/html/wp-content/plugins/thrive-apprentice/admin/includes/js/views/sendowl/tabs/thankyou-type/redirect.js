( function ( $ ) {

	const base = require( '../../../content-base' );
	const settingItemModel = require( '../../../../models/setting-item' );
	const itemState = require( '../../../item-state' );
	const pageModel = require( '../../../../models/base-page' );

	module.exports = base.extend( {

		template: TVE_Dash.tpl( 'settings/sendowl/redirect-th-options' ),

		afterInitialize: function ( options ) {

			const save = () => {
				const model = new settingItemModel( {key: 'welcome_message', value: this.model.get( 'message' )} );

				if ( ! model.isValid() ) {
					TVE_Dash.err( model.validationError.message );
					return;
				}

				const xhr = model.save();

				if ( xhr ) {
					xhr.done( () => TVE_Dash.success( TVA.t.settings_tab.checkout_screen.message_updated ) )
				}
			};

			this.model = new Backbone.Model( {message: TVA.settings.welcome_message.value} );

			this.model.on( 'tva_tinymce_blur', save );
		},

		afterRender: function () {

			TVA.Utils.renderMCE( 'tva-thankyou-message', this.model, 'message' );

			new itemState( {
				el: this.$( '.tva-thankyou-page-multiple' ),
				model: new pageModel( TVA.settings.thankyou_multiple_page ),
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your thank you page',
					},
					normal: {
						title: 'Thank you Page',
					},
					delete: {
						title: 'Are you sure you want to remove this thank you page?',
					},
				},
				settings: {
					normal: {
						edit_with_tar: parseInt( TVA.tar_active ) === 1,
					},
				},
				afterRender: function () {
					this.$( '.tva-page-label' ).append( `<br><span class="tva-notice-span tvd-tooltipped" data-position="top" data-tooltip="If one of your customers purchases access to more than one course then we will show this thank you page rather than redirecting to the start of one of the courses.">${TVA.t.settings_tab.checkout_screen.th_info}</span>` );
					this.$( '.tva-page-label' ).prepend( `<h3>${TVA.t.settings_tab.checkout_screen.several_courses}</h3>` );
				}
			} ).render();

			requestAnimationFrame( TVA.Utils.rebindWistiaFancyBoxes );
		}
	} );

} )( jQuery() );
