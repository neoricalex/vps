/**
 * Specific model for ThriveCart Integration
 */
module.exports = require( './base' ).model.extend( {

	getText: function () {
		return TVA.t.integrations.thrivecart.rule_text;
	}
} );
