module.exports = require( './base' ).extend( {
	defaults: {
		'tooltip': `data-position="top" data-tooltip="${TVA.t.OptionUnavailable}"`
	},
	url: function () {
		return `${TVA.routes.settings}/get_available_settings/`;
	}
} );
