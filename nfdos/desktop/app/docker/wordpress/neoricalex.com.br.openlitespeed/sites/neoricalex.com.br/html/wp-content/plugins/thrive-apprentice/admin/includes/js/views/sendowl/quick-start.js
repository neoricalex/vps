const base = require( '../content-base' );

module.exports = base.extend( {
	afterInitialize: function () {
		const sendOwl = TVA.sendowl;

		this.model = new Backbone.Model();

		const hasCheckoutPage = _.isNumber( TVA.settings.checkout_page.value ) && parseInt( TVA.settings.checkout_page.value ) > 0,
			hasThankYouPage = _.isNumber( TVA.settings.thankyou_page.value ) && parseInt( TVA.settings.checkout_page.value ) > 0,
			hasAccountKeys = TVA.settings.account_keys.value && TVA.settings.account_keys.value.secret;

		const object = {
			step1Completed: Array.isArray( sendOwl.bundles ) && sendOwl.bundles.length > 0 || Array.isArray( sendOwl.products ) && sendOwl.products.length > 0,
			step2Completed: hasCheckoutPage && hasThankYouPage,
			step3Completed: hasCheckoutPage,
			step4Completed: hasAccountKeys,
			step5Completed: TVA.courses.length > 0,
			step6Completed: TVA.courses.getSendOwlItems().length > 0,
			step7Completed: hasAccountKeys
		};

		this.model.set( object );
	},
	template: TVE_Dash.tpl( 'settings/sendowl/quick-start' ),
} );
