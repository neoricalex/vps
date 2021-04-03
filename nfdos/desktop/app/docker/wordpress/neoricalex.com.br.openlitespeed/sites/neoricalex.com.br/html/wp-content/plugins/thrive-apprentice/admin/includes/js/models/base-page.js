module.exports = require( './base' ).extend( {

	defaults: function () {

		return {
			preview_url: '',
			title: '',
			edit_url: '',
			value: ''
		}
	},

	initialize: function () {

		let state = 'search';

		if ( parseInt( this.get( 'value' ) ) ) {
			state = 'normal';
		}

		this.attributes.state = state;
	},

	url: function () {

		if ( this.get( 'state' ) === 'search' ) {
			return `${TVA.routes.settings_v2}/core-page/update`;
		} else {
			return `${TVA.routes.settings_v2}/core-page/${this.get( 'state' )}`;
		}
	},

	validate: function ( options ) {
		const errors = [];

		if ( options.state === 'create' && ! options.title ) {
			errors.push( this.validation_error( 'title', '' ) );
			return errors;
		}
	}
} );
