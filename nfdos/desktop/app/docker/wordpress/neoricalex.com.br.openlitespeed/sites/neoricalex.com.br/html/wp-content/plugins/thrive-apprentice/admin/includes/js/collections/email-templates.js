const EmailTemplateModel = require( '../models/email-template' );

/**
 * List of Rules which helps TA protect content
 */
module.exports = Backbone.Collection.extend( {

	/**
	 * @property {Backbone.Model}
	 */
	model: EmailTemplateModel
} );
