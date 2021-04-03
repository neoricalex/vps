( function ( $ ) {
	const ContentBase = require( './content-base' ),
		SettingItemModel = require( '../models/setting-item' ),
		Modal = require( './modals/wizard' );

	module.exports = ContentBase.extend( {
		initialize: function () {

			if ( ! TVA.licenseActivated ) {
				return;
			}

			this.openModal( Modal, {
				model: new SettingItemModel( {key: 'wizard', value: ''} ),
				width: '1180px',
				top: '40px',
				className: 'tvd-modal tvd-modal-big',
				no_close: true,
				dismissible: false
			} );

			TVE_Dash.hideLoader();
			TVA.settings.show_hi_professor_modal = true
		}
	} );
} )( jQuery );
