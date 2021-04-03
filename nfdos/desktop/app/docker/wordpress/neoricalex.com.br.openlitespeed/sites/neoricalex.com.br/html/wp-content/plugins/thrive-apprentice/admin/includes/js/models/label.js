const Topic = require( './topic' );
/**
 * Specific model for Label
 */
module.exports = Topic.extend( {

	/**
	 * Message to be displayed after save
	 *
	 * @type {String}
	 */
	savedMessage: TVA.t.label_saved,

	/**
	 * Default props. Always use a function for returning these
	 *
	 * @return {{color: string, label_color: string, checked: number, title: string}}
	 */
	defaults() {
		return {
			title: 'New Label',
			color: '#58a545',
			label_color: '#58a545',
		};
	},

	/**
	 * URL used for server-side sync
	 *
	 * @return {string}
	 */
	url() {
		return this.urlWithId( TVA.routes.labels );
	},

	/**
	 * Apply changes and store model server-side
	 *
	 * @param {Object} changes
	 * @param {Object} options allows controlling behaviour
	 *
	 * @return {jQuery.Deferred} ajax promise
	 */
	persist( changes, options = {loader: true} ) {
		/* turns out labels use both `color` and `label_color` fields (IDK why) */
		if ( changes.color ) {
			changes.label_color = changes.color;
		}

		return Topic.prototype.persist.apply( this, arguments );
	}
} );
